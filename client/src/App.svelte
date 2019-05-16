<script>
  import Input from './Input.svelte';
  import Explanations from './Explanations.svelte';
  import sjcl from 'sjcl';

  let file;

  const binaryToHash = (binary) => {
    const hash = sjcl.hash.sha256.hash(binary);
    return sjcl.codec.hex.fromBits(hash);
  };

  const register = () => {
    const reader = new FileReader();
    reader.onload = ev => {
      const hex = binaryToHash(ev.target.result);
      console.log(hex);
    };
    reader.readAsBinaryString(file);
  };
</script>

<style>
  .container {
    margin: 1rem;
    display: flex;
    flex-direction: column;
  }
</style>

<div class="container">
  <h1>Orbs Notary</h1>
  <Explanations />
  <Input on:change={ev => (file = ev.detail)} />
  <button disabled={!file} on:click={register}>Register</button>
  <button disabled={!file}>Verify</button>
</div>
