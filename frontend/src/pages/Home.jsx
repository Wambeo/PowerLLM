import { useState, useEffect, useRef} from 'react'
import { Send, MessageCircle, Sparkles, Globe } from "lucide-react";

export default function() {
    const [message, setMessage] = useState("");
    const[chatHistory, setChatHistory] = useState([])
    const [isLoading, setIsLoading] = useState(false);
    const [isChatActive, setIsChatActive] = useState(true);
    const[conversationId, setConversationId] = useState(null)
    const chatContainerRef = useRef(null)
   

    useEffect(()=>{
      if(chatContainerRef.current){
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    }, [chatHistory]);

    useEffect(()=>{
      if(!conversationId){
        setConversationId(Date.now().toString())
      }
    },[conversationId])

     const handleSubmit = async(e) =>{
      e.preventDefault();
      if(message.trim() === "") return;
      setIsLoading(true);
      setChatHistory((prevHistory) => [...prevHistory, {sender: 'user', text: message}]);

      try{
        const response = await fetch('http://localhost:8000/chat/',{
          method: 'POST',
          headers: {
            'Content-Type' : 'application/json',
          },
          body: JSON.stringify({
            message,
            conversation_id: conversationId,
          }),
        });
        if (!response.ok){
          throw new Error('Error with API request');

        }
        const data = await response.json()
        setChatHistory((prevHistory)=>[
          ...prevHistory, {sender: 'ai', text: data.response},
        ]);
        setMessage('')
      }
      catch(error){
        console.error('Error:', error)
      }
      finally{
        setIsLoading(false)
      }
     }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-elegant">
              <Globe className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-purple-600">
              Power Documentation Assistant
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant, accurate information about travel documentation requirements for any destination worldwide
          </p>
        </div>
        </div>
        <div
        ref={chatContainerRef}
        className="overflow-y-auto h-96 space-y-4 mb-4 p-4 border border-zinc-900 rounded-lg "
        >
          {
            chatHistory.map((msg, index) =>(
              <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-white'}`}>
                {msg.text}
              </div>
            </div>
            ))
          }
        </div>
        {/* Question Input */}
        <div className="bg-gradient-div shadow-card border-0 mb-8 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <label className="text-sm font-medium text-foreground flex flex-col space-y-1.5 p-6">
                Ask about travel documentation requirements
              </label>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., What documents do I need to travel from Kenya to Ireland?"
              className="min-h-[120px] w-[80vw] resize-none border-border/50 focus:border-primary transition-smooth border border-input"
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:shadow-elegant transition-all duration-300 gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Generating Response...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Ask Assistant
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}
