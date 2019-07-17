<script>
  export let privateKey, address;
  let showPrivateKey = false;

  const toggleShowPrivateKey = () => {
    showPrivateKey = !showPrivateKey;
  }
</script>

<style>
    .address {
        font-family: 'Courier New', Courier, monospace
    }
</style>

<div>
Your address is <span class="address">{address}</span>
<button on:click={toggleShowPrivateKey}>{#if showPrivateKey}Hide private key{:else}Show private key{/if}</button>
<br/>
{#if showPrivateKey}
<p class="address">{privateKey}</p>
{/if}
</div>
