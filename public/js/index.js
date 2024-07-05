async function setSession() {
  try {
    const response = await fetch('/verify?username='+localStorage.getItem('username'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'insomnia/8.6.1',
        'authorization': localStorage.getItem('authToken')
      }
    });

    const data = await response.json();
    
    if (data.success) {
      document.cookie = JSON.stringify(data)
      replaceLoginButton(document.cookie);
      await getGames()
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function replaceLoginButton(cookie) {
    var data = "{\"success" + cookie.split("{\"success").pop()
    localStorage.setItem("authData",data)
    const user = JSON.parse(localStorage.getItem("authData"))
    console.log(user)
    localStorage.setItem('authToken',user.token)
    localStorage.setItem('username',user.username)
    localStorage.setItem('balance',user.balance)
    const username = localStorage.getItem('username')
    const balance = localStorage.getItem('balance')
    // Find the login button
    const loginButton = document.querySelector('.login-btn');

    // Check if the login button exists
    if (loginButton) {
        // Create a new div element
        const newDiv = document.createElement('div');
        newDiv.style.display = 'flex';
        newDiv.style.alignItems = 'center';

        // Create the first paragraph element
        const balanceParagraph = document.createElement('p');
        console.log(balance)
        balanceParagraph.textContent = '$'+balance

        // Create the second paragraph element
        const usernameParagraph = document.createElement('p');
        usernameParagraph.textContent = `| ${username}`;
        usernameParagraph.style.marginLeft = '5px';

        // Create the image element
        const logoutImage = document.createElement('img');
        logoutImage.src = '/images/logout.webp';
        logoutImage.alt = 'Logout Icon';
        logoutImage.className = 'logout-icon';
        logoutImage.style.marginLeft = '10px';

        // Append the paragraphs and image to the new div
        newDiv.appendChild(balanceParagraph);
        newDiv.appendChild(usernameParagraph);
        newDiv.appendChild(logoutImage);

        // Replace the login button with the new div
        loginButton.parentNode.replaceChild(newDiv, loginButton);

        
    }
}

async function getGames(){

  const gamesData = await fetch('/games', {
    headers: {
      'Content-Type': 'multipart/form-data',
      'User-Agent': 'insomnia/8.6.1',
      'authorization': localStorage.getItem('authToken')
    }
  });

  const games = await gamesData.json()
  console.log(games)
  Object.values(games).forEach(game => {
    addGame(game.createdby, game.value)
  });
  
}

document.addEventListener('DOMContentLoaded', function () {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    function updateShadowVisibility() {
        const chatShadowTop = document.querySelector('.chat-shadow-top');
        if (chatMessages.scrollTop === 0) {
            chatShadowTop.style.display = 'block';
        } else {
            chatShadowTop.style.display = 'block';
        }
    }
    chatMessages.addEventListener('scroll', updateShadowVisibility);
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            const newMessage = document.createElement('div');
            newMessage.classList.add('chat-message');
        
            const usernameElement = document.createElement('p');
            usernameElement.id = 'username';
            usernameElement.textContent = localStorage.getItem("username")+' :';
            newMessage.appendChild(usernameElement);
        
            const messageElement = document.createElement('p');
            messageElement.id = 'message';
            messageElement.textContent = chatInput.value;
            newMessage.appendChild(messageElement);
        
            chatMessages.appendChild(newMessage);
            chatInput.value = '';
            scrollToBottom();
            updateShadowVisibility();
        }
    });

    // Initial scroll to bottom
    scrollToBottom();
});

    // Assume 'activeOption' is determined dynamically, e.g., based on URL or user interaction
    let activeOption = 'home'; // Example active option, could be 'withdraw', 'faq', 'terms'

    // Select the active link by its ID and add a background color
    document.getElementById(activeOption).style.backgroundColor = '#5e63c3'; // Example color


    document.querySelector('.login-btn').addEventListener('click', function() {
        document.getElementById('login-popup').classList.remove('hidden');
      });
      
      document.getElementById('next-btn').addEventListener('click', function() {
        const username = document.getElementById('username').value;
        if (username) {
          authUrl='/auth/roblox?username='+username
          const width = 500;
            const height = 700;
            const left = (screen.width / 2) - (width / 2);
            const top = (screen.height / 2) - (height / 2);
            window.open(authUrl, 'authWindow', `width=${width},height=${height},top=${top},left=${left}`);
            window.addEventListener('message', function(event) {
              if (event.origin === window.location.origin) {
                const data = event.data;
                console.log(data)
                if (data) {
                  // Store data in localStorage
                  deleteAllCookies()
                  document.cookie = JSON.stringify(data)
                  replaceLoginButton(document.cookie)
                  // Redirect to homepage or update UI accordingly
                } else {
                  alert('Authentication failed.');
                }
              }
            });
          document.getElementById('login-popup').classList.add('hidden');
        } else {
          alert('Please enter a username');
        }
      });
      
      // Optionally, close the popup when clicking outside the content
      document.getElementById('login-popup').addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.add('hidden');
        }
      });
      
      function halfGameValue() {
        // Get the input element by its ID
        var inputElement = document.getElementById('gamevalue');
        
        // Get the current value of the input element and convert it to an integer
        var currentValue = parseInt(inputElement.value, 10);
        
        // Calculate half of the current value
        var halfValue = currentValue / 2;
        
        // Set the halved value back to the input element
        inputElement.value = halfValue;
    }

    document.getElementById('halfer').addEventListener('click', halfGameValue);
    function doubleGameValue() {
      // Get the input element by its ID
      var inputElement = document.getElementById('gamevalue');
      
      // Get the current value of the input element and convert it to an integer
      var currentValue = parseInt(inputElement.value, 10);
      
      // Calculate half of the current value
      var halfValue = currentValue * 2;
      
      // Set the halved value back to the input element
      inputElement.value = halfValue;
  }

  // Assuming you have a button in your HTML like this:
// <button class="create-game-btn">Create Game</button>

// Select the button by its class name
const createGameBtn = document.querySelector('.create-game-btn');

// Add click event listener to the button
createGameBtn.addEventListener('click', function() {
    // Define the request parameters
    const url = '/games';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjIwNzA5MDUwOSIsInVzZXJuYW1lIjoiZ2Vvcmdlbm9yd2FsZCIsImlhdCI6MTcyMDE3NzA3NCwiZXhwIjoxNzIwMTgwNjc0fQ.KpEawP0W_4RDeJB4WKcYHn2SC2q7TRggV0RjiaoGFIY'
    };
    const body = JSON.stringify({
        "created_by": localStorage.getItem('username'),
        "value": document.getElementById('gamevalue').value        ,
        "time": "2024-07-05T12:00:00Z"
    });

    // Make the POST request using fetch API
    fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Handle the response data as needed
        console.log('Game created successfully:', data);
        window.location.reload()
        // You can add further handling here if required
    })
    .catch(error => {
        console.error('Error creating game:', error);
        // Handle errors here
    });
});

  function addGame(playerName, value) {
    // Get the parent div where the new game div will be inserted
    const gamesList = document.querySelector('.games-list');

    // Create a new div element for the game
    const gameDiv = document.createElement('div');
    gameDiv.classList.add('game');

    // Create and append the player div
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('player');
    playerDiv.textContent = playerName;
    gameDiv.appendChild(playerDiv);

    // Create and append the vs div
    const vsDiv = document.createElement('div');
    vsDiv.classList.add('vs');
    vsDiv.textContent = 'VS';
    gameDiv.appendChild(vsDiv);

    // Create and append the opponent div
    const opponentDiv = document.createElement('div');
    opponentDiv.classList.add('opponent');
    opponentDiv.textContent = 'Waiting...';
    gameDiv.appendChild(opponentDiv);

    // Create and append the value div
    const valueDiv = document.createElement('div');
    valueDiv.classList.add('value');
    valueDiv.textContent = `$${value}`;
    gameDiv.appendChild(valueDiv);

    // Create and append the join game button
    const joinGameBtn = document.createElement('button');
    joinGameBtn.classList.add('join-game-btn');
    joinGameBtn.textContent = 'Join Game';
    gameDiv.appendChild(joinGameBtn);

    // Append the new game div to the parent div
    gamesList.appendChild(gameDiv);
}


  document.getElementById('doubler').addEventListener('click', doubleGameValue);

  function deleteAllCookies() {
    const cookies = document.cookie.split(";");
  
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }
  window.onload = setSession
