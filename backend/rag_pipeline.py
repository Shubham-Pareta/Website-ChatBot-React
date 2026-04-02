import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document 

# 1. Initialize Embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'}
)

def process_website(texts, metadatas=None):
    """Chunks website content and builds the FAISS index."""
    if not texts:
        return None

    # Optimized chunking: 600 is better for specific component lists than 1000
    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
    
    docs = []
    # Handle case where metadatas might be None
    if metadatas is None:
        metadatas = [{}] * len(texts)

    for text, meta in zip(texts, metadatas):
        # Cleaning: Filter out junk noise that confuses the AI
        if any(x in text for x in ["Cookie Policy", "Terms of Use", "Sign In"]):
            continue
            
        chunks = splitter.split_text(text)
        for chunk in chunks:
            docs.append(Document(page_content=chunk, metadata=meta))

    return FAISS.from_documents(docs, embeddings)

def get_answer(query, vectordb):
    """Generates a highly accurate, grounded answer."""
    if not vectordb:
        return "System Error: Please index a website first."

    # Retrieval: k=4 is usually the 'sweet spot' for accuracy
    retriever = vectordb.as_retriever(search_kwargs={"k": 4})
    docs = retriever.invoke(query)
    context_text = "\n\n".join([doc.page_content for doc in docs])

    # LLM Setup: Lower temperature (0.1) makes the AI more factual and less 'creative'
    llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.1-8b-instant",
        temperature=0.1, 
    )

    # 4. THE STRICTER DYNAMIC PROMPT
    # I have added a "Groundedness" clause to prevent it from adding extra components.
    prompt = f"""
    You are a Professional Research Analyst. Answer the user's question using ONLY the context provided below.

    STRICT RULES:
    1. If the answer is not in the context, say "The provided website does not contain information about this."
    2. Do NOT use your own outside knowledge to add components or facts not mentioned in the text.
    3. If the user asks for a specific format (e.g., "points form", "1 line"), you MUST follow it.
    4. If no length is specified, be concise (under 5 lines).
    5. Ignore any navigation links, headers, or footers.

    CONTEXT FROM WEBSITE:
    {context_text}

    USER QUESTION: 
    {query}

    ACCURATE RESPONSE:
    """

    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        return f"Error generating response: {str(e)}"