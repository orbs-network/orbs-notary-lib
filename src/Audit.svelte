<script>
  export let events;

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
  td.break {
    height: 1rem;
  }
</style>

<h5>Events:</h5>
<table>
  {#each events as { action, from, to, signer, timestamp }, i }
  <tr>
    <td class="space">Date</td>
    <td class="wrap">{formatTimestamp(timestamp)}</td>
  </tr>
  <tr>
    <td class="space">Action</td>
    <td class="wrap">{action}</td>
  </tr>
  {#if from}
  <tr>
    <td class="space">Changed from</td>
    <td class="wrap">{from}</td>
  </tr>
  {/if}
  {#if to}
  <tr>
    <td class="space">Changed to</td>
    <td class="wrap">{to}</td>
  </tr>
  {/if}
  <tr>
    <td class="space">Signed by</td>
    <td class="wrap">{signer}</td>
  </tr> 
  <tr>
    <td class="space break"></td>
    <td class="wrap"></td>
  </tr>
  {/each}
</table>
