<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let isFileValid = true;
  const MB_10 = 10485760;

  const isValid = file => {
    return file.size < MB_10;
  };

  const handleFile = file => {
    isFileValid = true;

    if (!isValid(file)) {
      isFileValid = false;
      return;
    }

    dispatch('change', {file});
  };

  const handleMetadata = (metadata) => {
    console.log('metadata', metadata);
    dispatch('change', {metadata});
  };

</script>

<style>
  .container {
    margin: 2rem 0;
  }
  .validation {
    color: red;
    font-size: 0.8rem;
  }
  input[type=file] {
    border: none;
  }
  input[type=text] {
    width: 80%;
  }
</style>

<div class="container">
  <input type="text" placeholder="Document description" on:change={() => handleMetadata(this.value)}/>
  <br/>
  <input type="file" on:change={() => handleFile(this.files[0])} />
  {#if !isFileValid}
    <p class="validation">
      Size should not exceed 10MB. Please choose another file.
    </p>
  {/if}
</div>
