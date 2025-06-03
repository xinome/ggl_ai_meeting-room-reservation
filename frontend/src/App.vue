<template>
  <div id="app-container">
    <header>
      <!-- <nav>
        <router-link to="/">ホーム</router-link> |
        <router-link to="/my-reservations">マイ予約</router-link>
      </nav> -->
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>© {{ new Date().getFullYear() }} 会議室予約システム</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// No script needed for this basic layout
</script>

<style>
/* グローバルスタイル */
body {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f4f4f4;
}

#app-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 15px;
}

header {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
  text-align: center;
}

header nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  margin: 0 10px;
}

header nav a.router-link-exact-active {
  color: #42b983;
}

main {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

footer {
  text-align: center;
  margin-top: 30px;
  padding: 15px 0;
  font-size: 0.9em;
  color: #777;
  border-top: 1px solid #eee;
}
</style>
