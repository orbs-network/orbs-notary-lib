<script>
  export let result;

  const txToPrismUrl = (tx) => {
    return `${process.env.ORBS_PRISM_URL}/vchains/${process.env.ORBS_VCHAIN}/tx/${tx}`;
  };

  const formatTimestamp = timestamp =>
    new Date(timestamp / 1000 / 1000).toLocaleString('en-gb', {
      hour12: false,
      timeZone: 'UTC',
      timeZoneName: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
</script>

<style>
  table {
    font-size: 12px;
  }
  .space {
    padding-right: 1rem;
  }
  .wrap {
    word-break: break-all;
  }
</style>

<h5>Result:</h5>
<table>
  <tr>
    <td class="space">Content hash:</td>
    <td class="wrap">{result.hash}</td>
  </tr>

  {#if result.txHash}
    <tr>
      <td class="space">Tx hash:</td>
      <td class="wrap">
      <a href="{txToPrismUrl(result.txHash)}" target="_blank">{result.txHash}</a>
      </td>
    </tr>
  {/if}

  {#if result.timestamp !== 0}
    <tr>
      <td class="space">Signed by:</td>
      <td class="wrap">{result.signer}</td>
    </tr>
    <tr>
      <td class="space">Registered on:</td>
      <td>{formatTimestamp(result.timestamp)}</td>
    </tr>
    <tr>
      <td class="space">Metadata:</td>
      <td>
      {#if result.verified}
      {result.metadata}
      {:else}
      Encrypted
      {/if}
      </td>
    </tr>
  {/if}

  <tr>
    <td>Status:</td>
    <td>{result.timestamp !== 0 ? 'Registered' : 'Not Registered'}</td>
  </tr>

</table>
