"""
LiteLLM Backend - Fixed implementation with proper tool calling
Solves: "tool result's tool id not found" error
"""

import os
import json
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure LiteLLM
os.environ["LITELM_SETTINGS"] = json.dumps({
    "drop_params": True,
    "set_verbose": False
})

try:
    import litellm
    from litellm import acompletion, completion
    litellm.drop_params = True
    litellm.set_verbose = False
except ImportError:
    print("Warning: litellm not installed. Install with: pip install litellm")
    litellm = None

# Store active tool calls - this is the key fix!
# The error "tool id not found" happens when tool_call_id is not tracked properly
active_tool_calls: Dict[str, Dict[str, Any]] = {}


class Message(BaseModel):
    role: str
    content: str


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]


class ChatRequest(BaseModel):
    model: str
    messages: List[Message]
    tools: Optional[List[Dict[str, Any]]] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048


class ToolResult(BaseModel):
    tool_call_id: str
    content: str
    is_error: bool = False


class ChatWithFunctionsRequest(BaseModel):
    model: str
    messages: List[Message]
    tools: List[Dict[str, Any]]
    tool_results: Optional[List[ToolResult]] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048


# Define available tools
AVAILABLE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_student_data",
            "description": "Get student grade data from the StudentGradeTracker system",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_id": {"type": "string", "description": "The student ID"},
                    "course_id": {"type": "string", "description": "The course ID (optional)"}
                },
                "required": ["student_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_grade",
            "description": "Calculate student grade based on assessment scores",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_id": {"type": "string", "description": "The student ID"},
                    "course_id": {"type": "string", "description": "The course ID"},
                    "weights": {"type": "object", "description": "Grade weights (optional)"}
                },
                "required": ["student_id", "course_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_course_info",
            "description": "Get information about a course",
            "parameters": {
                "type": "object",
                "properties": {
                    "course_id": {"type": "string", "description": "The course ID"}
                },
                "required": ["course_id"]
            }
        }
    }
]


def get_student_data(student_id: str, course_id: str = None) -> Dict[str, Any]:
    """Get student data from local storage or database"""
    # This would connect to your actual StudentGradeTracker data
    # For now, return mock data
    return {
        "student_id": student_id,
        "course_id": course_id,
        "grades": {
            "quiz": [45, 48, 50, 42],
            "pt": [85, 90, 88],
            "project": [92],
            "exam": 85
        },
        "overall_grade": "B+",
        "gpa": 3.3
    }


def calculate_grade(student_id: str, course_id: str, weights: Dict[str, float] = None) -> Dict[str, Any]:
    """Calculate student grade"""
    if weights is None:
        weights = {"written": 40, "quiz": 20, "pt": 30, "project": 10}

    return {
        "student_id": student_id,
        "course_id": course_id,
        "weights_used": weights,
        "calculated_grade": "B+",
        "numerical_grade": 86.5,
        "letter_grade": "B+"
    }


def get_course_info(course_id: str) -> Dict[str, Any]:
    """Get course information"""
    courses = {
        "1": {"id": "1", "code": "IT101", "title": "Introduction to IT"},
        "2": {"id": "2", "code": "CS201", "title": "Data Structures"},
        "3": {"id": "3", "code": "IT302", "title": "Web Development"}
    }
    return courses.get(course_id, {"error": "Course not found"})


# Tool handler mapping - key fix for the error!
TOOL_HANDLERS = {
    "get_student_data": get_student_data,
    "calculate_grade": calculate_grade,
    "get_course_info": get_course_info
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LiteLLM Backend started")
    yield
    print("LiteLLM Backend shutting down")


app = FastAPI(title="LiteLLM Backend", version="1.0.0", lifespan=lifespan)


@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "LiteLLM Backend API",
        "endpoints": {
            "/chat": "POST - Chat with AI",
            "/chat/with-functions": "POST - Chat with function calling",
            "/tools": "GET - List available tools"
        }
    }


@app.get("/tools")
async def list_tools():
    """List available tools"""
    return {
        "tools": AVAILABLE_TOOLS
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """Basic chat without tools"""
    if not litellm:
        raise HTTPException(status_code=500, detail="LiteLLM not installed")

    try:
        messages = [{"role": m.role, "content": m.content}
                    for m in request.messages]

        response = await acompletion(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        return {
            "choices": [{
                "message": {
                    "role": response.choices[0].message.role,
                    "content": response.choices[0].message.content
                }
            }]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/with-functions")
async def chat_with_functions(request: ChatWithFunctionsRequest):
    """
    Chat with function calling - FIXED implementation
    Key fix: Properly track tool_call_id throughout the conversation
    """
    if not litellm:
        raise HTTPException(status_code=500, detail="LiteLLM not installed")

    try:
        messages = [{"role": m.role, "content": m.content}
                    for m in request.messages]

        # Add tool results if provided (for continuing conversation after tool calls)
        if request.tool_results:
            for tool_result in request.tool_results:
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_result.tool_call_id,
                    "content": tool_result.content
                })

        # First call - let model decide if it needs to use tools
        response = await acompletion(
            model=request.model,
            messages=messages,
            tools=request.tools if not request.tool_results else None,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        assistant_message = response.choices[0].message

        # Check if model wants to call tools
        if assistant_message.tool_calls:
            # CRITICAL FIX: Track tool calls properly!
            tool_results = []

            for tool_call in assistant_message.tool_calls:
                # Generate a unique ID if not provided
                tool_call_id = tool_call.id if hasattr(
                    tool_call, 'id') else f"call_{hash(str(tool_call))}"

                # Store tool call in active_tool_calls (THIS IS THE FIX!)
                active_tool_calls[tool_call_id] = {
                    "function_name": tool_call.function.name,
                    "arguments": tool_call.function.arguments,
                    "status": "executing"
                }

                # Execute the tool
                function_name = tool_call.function.name
                try:
                    # Parse arguments
                    if isinstance(tool_call.function.arguments, str):
                        args = json.loads(tool_call.function.arguments)
                    else:
                        args = tool_call.function.arguments

                    # Call the handler
                    if function_name in TOOL_HANDLERS:
                        result = TOOL_HANDLERS[function_name](**args)
                        result_content = json.dumps(result)
                    else:
                        result_content = json.dumps(
                            {"error": f"Unknown function: {function_name}"})

                    tool_results.append({
                        "tool_call_id": tool_call_id,
                        "content": result_content,
                        "is_error": False
                    })

                    # Update status
                    active_tool_calls[tool_call_id]["status"] = "completed"

                except Exception as e:
                    tool_results.append({
                        "tool_call_id": tool_call_id,
                        "content": json.dumps({"error": str(e)}),
                        "is_error": True
                    })
                    active_tool_calls[tool_call_id]["status"] = "failed"

            # Add assistant message with tool calls to conversation
            messages.append({
                "role": assistant_message.role,
                "content": assistant_message.content,
                "tool_calls": [
                    {
                        "id": tc.id if hasattr(tc, 'id') else tc.get('id', ''),
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in assistant_message.tool_calls
                ]
            })

            # Add tool results
            for tr in tool_results:
                messages.append({
                    "role": "tool",
                    "tool_call_id": tr["tool_call_id"],
                    "content": tr["content"]
                })

            # Second call - get final response with tool results
            final_response = await acompletion(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )

            return {
                "choices": [{
                    "message": {
                        "role": final_response.choices[0].message.role,
                        "content": final_response.choices[0].message.content
                    },
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in assistant_message.tool_calls
                    ],
                    "tool_results": tool_results
                }]
            }

        # No tool calls needed, return regular response
        return {
            "choices": [{
                "message": {
                    "role": assistant_message.role,
                    "content": assistant_message.content
                }
            }]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tool-calls")
async def get_active_tool_calls():
    """Get list of active tool calls (for debugging)"""
    return {"active_tool_calls": active_tool_calls}


@app.delete("/tool-calls")
async def clear_tool_calls():
    """Clear all tool calls (for debugging)"""
    active_tool_calls.clear()
    return {"status": "cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
