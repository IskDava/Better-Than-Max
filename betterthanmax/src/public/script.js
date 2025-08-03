let token = localStorage.getItem('token');
const publicVAPIDKey = "BIbnV-bRqaSp8IOKCHemISYf1RKQeSXkXB_QsfLC0x2pdatkr-spzj8TF_Wy-cRukUnWddrodRggRt5bWLWnwAE";

let isLoggingIn = true;
let isAuthenticating = false;

let messages = [];

const apiBase = '/';

function toggleLogin() {
    const authTitle = document.getElementById('auth-title');
    const toggleContext = document.getElementById('toggle-login-context');

    if (isLoggingIn) {
        authTitle.innerText = "Register";
        toggleContext.innerHTML = `Old? <button id='toggle-login' onclick=\"toggleLogin()\">Sign in</button>`;
        isLoggingIn = false;
    }
    else {
        authTitle.innerText = "Login";
        toggleContext.innerHTML = `New?
        <button id='toggle-login' onclick=\"toggleLogin()\">Sign up</button>`;
        isLoggingIn = true;
    }
}

async function authenticate() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const submitBtn = document.getElementById("authenticate");

    const err = document.getElementById('err');
    if (!username) {
        err.innerText = "Username is required";
    } else if (!password) {
        err.innerText = "Password is required";
    } else if (password.length < 6) {
        err.innerText = "Password must be at least 6 characters long";
    } else if (isAuthenticating) {
        err.innerText = "Already authenticating. Wait please..."
    } 
    else {
        err.innerText = "";
    }

    if (err.innerText != "") {
        return;
    }

    isAuthenticating = true;
    submitBtn.innerText = "Authenticating...";

    try {
        let data, statuscode;
        if (isLoggingIn) {
        const response = await fetch(apiBase + 'auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            })
        data = await response.json()
        statuscode = response.status;
        }
        else {
        const response = await fetch(apiBase + 'auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            });
        data = await response.json();
        statuscode = response.status;
        }

        if (data.token) {
            token = data.token;
            console.log(statuscode);
            err.innerText = "SUCCESS"

            localStorage.setItem("token", token);

            await fetchGlobalChat();
        }
        else if (statuscode % 100 != 2) {
        err.innerText = data.message;
        }
        
    } catch (err) {
        console.log(err);
        err.innerText = err;
    } finally {
        submitBtn.innerText = "Submit";
        isAuthenticating = false;
    }
}

async function fetchGlobalChat() {
    const chats = document.querySelectorAll(".chat");
    chats.forEach(chat => chat.hidden = false);
    const loginbox = document.querySelector(".loginbox");
    loginbox.hidden = true;
    const response = await fetch(apiBase + 'chats/globalChat', {
        method: "GET",
        headers: { 'Authorization': token }
    });
    const messages = await response.json();

    if (response.status != 200) {
        const li = document.createElement("li");

        const username = "SystemWarning";
        li.innerHTML = messages.message;
        li.classList.add("minemessage");
        li.classList.add("message");

        document.getElementById("chat").appendChild(li);
    }

    messages.forEach(message => {
        const li = document.createElement("li");

        const username = message.sender.username;
        li.innerHTML = `<span class="name">${message.isMine ? "Me": message.sender.username} </span><span class=\"msgcontent\">${message.content}</span>`;
        li.classList.add(message.isMine ? "minemessage": "theirmessage");
        li.classList.add("message");

        document.getElementById("chat").appendChild(li);
    })
}

const scheme = location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${scheme}//${location.host}`);

ws.onmessage = e => {
    console.log("Got a message!")

    console.log("Recieving data");
    const data = JSON.parse(e.data);

    console.log("Authorizing sender");
    const isMine = data.name == getUsername();

    console.log("Showing message in the chat");
    let li = createMessage(isMine? "Me": data.name, data.content, isMine);

    const message = li.querySelector(".msgcontent").textContent.trim();

    console.log("Sending push notification...")
    if ("serviceWorker" in navigator) {
        sendPushNotification(message).catch((err) => console.error(err));
    }

    console.log("Scrolling down")
    scrollToChatInput();
};

function scrollToChatInput(scrollView = false) {
    const chat = document.getElementById("chat");
    if (!chat.lastElementChild) { return; }
    if (scrollView) {
        chat.lastElementChild.scrollIntoView({ behavior: "smooth" });
    }
    chat.scrollTop = chat.scrollHeight;
}

document.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        sendMsg();
    }
})

async function sendMsg() {
    console.log("Scanning input value");
    const input = document.getElementById("msg");

    if (!input.value.trim()) {
        console.warn("Nothing in input, so canceling sending");
        return;
    }

    console.log("Sending message to other user(-s)");
    ws.send(JSON.stringify({token: token, content: input.value}));

    console.log("Showing the message in local chat");
    createMessage("Me", input.value, true);

    console.log("Clarifying user's name");
    const username = await getUsername();

    console.log("Adding message to the database");
    await fetch(apiBase + "chats/globalChat", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ content: input.value, senderUsername: username }),
    });

    console.log("Clearing input");
    input.value = "";

    console.log("Scrolling down");
    scrollToChatInput(true);
}

async function sendPushNotification(message) {
    const register = await navigator.serviceWorker.register("../sw.js", {
        scope: "/",
    });

    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVAPIDKey),
    });

    await fetch(apiBase + `notification?message=${encodeURIComponent(message)}`, {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
        "content-type": "application/json",
        }
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function createMessage(name, content, isMine) {
    let li = document.createElement("li");

    li.innerHTML = `<span class=\"name\">${name} <br></span><span class=\"msgcontent\">${content}</span>`;

    li.classList.add(isMine? "minemessage": "theirmessage");
    li.classList.add("message");

    document.getElementById("chat").appendChild(li);

    li.addEventListener("mousedown", (e) => {
        if (e.button == 0) {
            console.log("it worked!")
        }
    });
    return li;
}

async function getUsername() {
    console.log("Authentificating user's name")
    const response = await fetch(apiBase + 'security/getusername', {
        method: 'GET',
        headers: { 'Authorization': token }
    });
    data = await response.json();

    if (response.status != 200) {
        console.error(data.message);
    } else {
        console.log(`Username is found successfuly: ${data.name}`);
        return data.name;
    }
}