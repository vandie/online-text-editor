<template>
  <div id="app">
    <div class="users">
      <span
        :style="`background: ${user.color}`"
        v-for="user in users" :key="`key-${user.name}`"
        class="users__user">
          {{user.name}}
      </span>
    </div>
    <div class="editor">
      <div class="content">
        {{displayData}}
      </div>
    </div>
  </div>
</template>

<script>
import { randomColor } from './lib/genericFunctions';

export default {
  name: 'App',
  data() {
    return {
      users: [],
      client: null,
      beenSentUsers: false,
      connected: false,
      name: null,
      text: '',
      lastUpdate: '',
      cursor: [0, 0],
      beenSentText: false,
      capsLock: false,
    };
  },
  computed: {
    displayData() {
      return this.text;
    },
  },
  methods: {
    logKeyPress(e) {
      const key = e.keyCode || e.charCode;
      if (key === 8 || key === 46) {
        this.text = this.text.slice(0, this.cursor[0]) + this.text.slice(this.cursor[1]);
        const location = this.cursor[0] - 1;
        this.cursor[1] = location;
        this.cursor[0] = location;
      } else if (key === 13) {
        this.text = `${this.text.slice(0, this.cursor[0])}\n${this.text.slice(this.cursor[1])}`;
        const location = this.cursor[0] + 1;
        this.cursor[1] = location;
        this.cursor[0] = location;
      } else if (key === 32) {
        this.text = `${this.text.slice(0, this.cursor[0])} ${this.text.slice(this.cursor[1])}`;
        const location = this.cursor[0] + 1;
        this.cursor[1] = location;
        this.cursor[0] = location;
      } else if (key === 20) {
        this.capsLock = !this.capsLock;
      } else {
        this.text = this.text.slice(0, this.cursor[0])
        + (this.capsLock
          ? String.fromCharCode(key).toUpperCase()
          : String.fromCharCode(key).toLowerCase()
        )
        + this.text.slice(this.cursor[1]);
        const location = this.cursor[0] + 1;
        this.cursor[1] = location;
        this.cursor[0] = location;
      }
      this.updateText();
    },
    updateText() {
      if (this.beenSentText) {
        console.log('sending updated text');
        this.client.send(JSON.stringify({
          action: 'updateText',
          text: this.text,
        }));
        this.lastUpdate = this.text;
      }
    },
    getUpdatedText(data) {
      console.log('Sent updated text');
      this.text = data.text;
      this.lastUpdate = data.text;
      setTimeout(() => {
        this.beenSentText = true;
      }, 1000);
    },
    updateCaret(e) {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      this.cursor = [start, end];
    },
    nameTaken(name) {
      return this.users.some((user) => name === user.name);
    },
    register() {
      let name = prompt('What are you called?');
      while (this.nameTaken(name)) {
        name = prompt('That name is taken, What are you called?');
      }
      this.name = name;
      this.client.send(JSON.stringify({
        action: 'RegisterName',
        name: this.name,
      }));
    },
    updateUsers(data) {
      const newUsers = data.clients.filter((name) => this.nameTaken(name) === false);
      this.users = this.users.filter(({ name }) => data.clients.includes(name));
      this.users.push(...(newUsers.map((name) => ({
        name,
        color: randomColor(),
        location: [0, 0],
      }))));
      this.beenSentUsers = true;
      if (this.name === null) {
        this.register();
      }
    },
    async actionHandler({ data }) {
      try {
        const jsonData = JSON.parse(data);
        if (!jsonData.action) {
          throw new Error('Null Action');
        }
        const actionFunctions = {
          clientList: this.updateUsers,
          updateText: this.getUpdatedText,
        };
        if (!actionFunctions[jsonData.action]) {
          throw new Error('Invalid action');
        }

        await actionFunctions[jsonData.action](jsonData);
      } catch (e) {
        console.error(e.message);
      }
    },
    async init() {
      this.client = new WebSocket('ws://localhost:3000');
      this.client.addEventListener('open', function open() {
        console.log('connected');
        this.connected = true;
      });
      this.client.addEventListener('message', this.actionHandler);
      window.addEventListener('keyup', this.logKeyPress);
    },
  },
  mounted() {
    this.init();
  },
  components: {},
};
</script>

<style lang="scss">
.users {
  display: flex;
}
textarea {
  width: 100%;
  height: auto;
  font-size: 1rem;
  border: none;
  padding: 1rem;
  outline: none;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  min-height: 1000px;
}

.content {
  width: 100%;
  height: auto;
  font-size: 1rem;
  padding: 1rem;
  z-index: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  min-height: 1000px;
}

.editor {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
}
</style>
