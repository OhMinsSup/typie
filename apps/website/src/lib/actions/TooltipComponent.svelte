<script lang="ts">
  import { scale } from 'svelte/transition';
  import { css } from '$styled-system/css';
  import type { ArrowAction, FloatingAction } from './floating.svelte';

  type Props = {
    message: string;
    trailing?: string;
    floating: FloatingAction;
    arrow: ArrowAction;
  };

  let { message, trailing, floating, arrow }: Props = $props();
</script>

<div
  class={css({
    borderRadius: '4px',
    paddingX: '8px',
    paddingY: '4px',
    fontSize: '12px',
    fontWeight: 'semibold',
    color: 'text.bright',
    backgroundColor: 'surface.dark',
    boxShadow: 'medium',
    zIndex: '50',
    pointerEvents: 'none',
  })}
  role="tooltip"
  use:floating
  transition:scale|global={{ start: 0.9, duration: 200 }}
>
  <span>{message}</span>

  {#if trailing}
    <span class={css({ marginLeft: '4px', color: 'text.bright', opacity: '50' })}>{trailing}</span>
  {/if}

  <div
    class={css({
      borderTopLeftRadius: '2px',
      size: '8px',
      backgroundColor: 'surface.dark',
    })}
    use:arrow
  ></div>
</div>
