
const assistantId = "asst_q1BSVcexieN7ix5vFFCGjRYe";
const apiKey = "sk-proj-Hd9qTjqdyDTYj-kI8I4YPkYla3bQYn17-BzRliSVc1lac4qwGgV_jm5qb-IqyJ_SocWg3Ikqh4T3B1bkFJGUUtZ6iH6PoATyJQHUZghoa3m065_viQ_OuuHqUtlbl2e_jgHMouxqrZHC9wM4cQMXc0-LQA";

const messagesDiv = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");

let imageFiles = [];

function previewImages() {
  const files = Array.from(imageInput.files);
  for (let file of files) {
    if (imageFiles.length >= 5) {
      alert("Você pode enviar no máximo 5 imagens.");
      break;
    }
    imageFiles.push(file);
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement("div");
      const img = document.createElement("img");
      const btn = document.createElement("button");
      img.src = e.target.result;
      btn.innerText = "x";
      btn.onclick = () => {
        imagePreview.removeChild(div);
        imageFiles = imageFiles.filter(f => f !== file);
      };
      div.appendChild(img);
      div.appendChild(btn);
      imagePreview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
  imageInput.value = "";
}

function appendMessage(content, isBot) {
  const div = document.createElement("div");
  div.className = "message " + (isBot ? "bot" : "user");
  div.innerText = content;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text && imageFiles.length === 0) return;

  appendMessage(text, false);
  chatInput.value = "";
  appendMessage("Gerando anúncio...", true);

  try {
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v1"
      }
    });
    const threadData = await threadRes.json();
    const threadId = threadData.id;

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v1",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "user",
        content: text
      })
    });

    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v1",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });
    const runData = await runRes.json();

    let status = "queued", output;
    while (status !== "completed") {
      const check = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runData.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v1"
        }
      }).then(res => res.json());
      status = check.status;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const messages = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v1"
      }
    }).then(res => res.json());

    const botMessage = messages.data[0].content[0].text.value;
    document.querySelectorAll(".bot").forEach(el => {
      if (el.innerText === "Gerando anúncio...") el.remove();
    });
    appendMessage(botMessage, true);

  } catch (err) {
    console.error(err);
    appendMessage("Erro ao gerar o anúncio.", true);
  }
}
