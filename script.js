
const assistantId = "asst_q1BSVcexieN7ix5vFFCGjRYe";
const apiKey = "sk-proj-Hd9qTjqdyDTYj-kI8I4YPkYla3bQYn17-BzRliSVc1lac4qwGgV_jm5qb-IqyJ_SocWg3Ikqh4T3B1bkFJGUUtZ6iH6PoATyJQHUZghoa3m065_viQ_OuuHqUtlbl2e_jgHMouxqrZHC9wM4cQMXc0-LQA";

async function enviarParaGPT() {
    const produto = document.getElementById("produto").value;
    const imagens = document.getElementById("imagens").files;
    const resultado = document.getElementById("resultado");
    const previews = document.getElementById("previews");
    resultado.innerHTML = "Gerando anúncio...";
    previews.innerHTML = "";

    Array.from(imagens).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.createElement("img");
            img.src = reader.result;
            previews.appendChild(img);
        };
        reader.readAsDataURL(file);
    });

    try {
        const thread = await fetch("https://api.openai.com/v1/threads", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "OpenAI-Beta": "assistants=v1"
            }
        }).then(res => res.json());

        const threadId = thread.id;

        await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "OpenAI-Beta": "assistants=v1",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                role: "user",
                content: produto
            })
        });

        const run = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "OpenAI-Beta": "assistants=v1",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                assistant_id: assistantId
            })
        }).then(res => res.json());

        let status = "queued", output;
        while (status !== "completed") {
            const runStatus = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "OpenAI-Beta": "assistants=v1"
                }
            }).then(res => res.json());
            status = runStatus.status;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const messages = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "OpenAI-Beta": "assistants=v1"
            }
        }).then(res => res.json());

        output = messages.data[0].content[0].text.value;
        resultado.innerHTML = output;

    } catch (error) {
        resultado.innerHTML = "Erro ao gerar anúncio.";
        console.error(error);
    }
}
