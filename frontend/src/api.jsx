// ✅ Empty string tells React to talk to the server hosting it
const API_BASE_URL = ""; 

export const indexWebsite = async (url) => {
  const response = await fetch(`${API_BASE_URL}/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url }),
  });
  return response.json();
};

export const askQuestion = async (text) => {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: text }),
  });
  return response.json();
};