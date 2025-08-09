import os
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("API key for Groq is missing. Please set the GROQ_API_KEY in the .env file.")

# FastAPI app
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq client
client = Groq(api_key=GROQ_API_KEY)

# Request model
class UserInput(BaseModel):
    destination_country: str
    nationality: str
    conversation_id: str

# Conversation store
class Conversation:
    def __init__(self):
        self.messages: List[Dict[str, str]] = [
            {
                "role": "system",
                "content": (
                    "You are a travel documentation assistant. "
                    "For any query, return ONLY a JSON object with these keys: "
                    "required_visa_documentation, passport_requirements, "
                    "additional_documents, travel_advisories."
                )
            }
        ]
        self.active: bool = True

conversations: Dict[str, Conversation] = {}

# Get or create a conversation
def get_or_create_conversation(conversation_id: str) -> Conversation:
    if conversation_id not in conversations:
        conversations[conversation_id] = Conversation()
    return conversations[conversation_id]

# Query Groq API
def query_groq_api(conversation: Conversation) -> Dict:
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=conversation.messages,
            temperature=0.5,
            max_tokens=512,
            top_p=1,
            stream=False
        )
        
        # Get full response
        response_text = completion.choices[0].message.content.strip()
        
        # Try parsing JSON output from model
        try:
            import json
            return json.loads(response_text)
        except Exception:
            raise HTTPException(
                status_code=500, 
                detail="Model did not return valid JSON."
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error with Groq API: {str(e)}")

# API route
@app.post("/travel-info/")
async def travel_info(input: UserInput):
    conversation = get_or_create_conversation(input.conversation_id)

    if not conversation.active:
        raise HTTPException(
            status_code=400, 
            detail="The chat session has ended. Please start a new session."
        )

    user_prompt = (
        f"Provide travel documentation details for a traveler from {input.nationality} "
        f"going to {input.destination_country}."
    )

    conversation.messages.append({"role": "user", "content": user_prompt})
    
    structured_response = query_groq_api(conversation)
    
    conversation.messages.append({"role": "assistant", "content": str(structured_response)})

    return {
        "destination_country": input.destination_country,
        "nationality": input.nationality,
        "requirements": structured_response,
        "conversation_id": input.conversation_id
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
