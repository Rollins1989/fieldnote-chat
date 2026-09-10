// worker.js
// A free Cloudflare Worker that proxies chat requests to Groq's free API.
// This keeps your GROQ_API_KEY secret (never exposed in the browser),
// which is the whole reason this file exists instead of calling Groq
// directly from chatbot.html.

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // for a portfolio demo this is fine;
                                           // lock it to your GitHub Pages domain later if you want.
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Browsers send a CORS preflight before the real POST — answer it.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const { messages, system } = await request.json();

      if (!Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "messages must be an array" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b", // free on Groq at time of writing
          messages: [
            { role: "system", content: system || "You are a helpful assistant." },
            ...messages,
          ],
          max_tokens: 1000,
        }),
      });

      if (!groqResponse.ok) {
        const errText = await groqResponse.text();
        return new Response(JSON.stringify({ error: errText }), {
          status: groqResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await groqResponse.json();
      const reply = data.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

