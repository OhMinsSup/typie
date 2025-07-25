<script lang="ts">
  import { base64 } from 'rfc4648';
  import { onMount } from 'svelte';
  import { sineOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import * as YAwareness from 'y-protocols/awareness';
  import * as Y from 'yjs';
  import { browser } from '$app/environment';
  import Logo from '$assets/logos/logo.svg?component';
  import { env } from '$env/dynamic/public';
  import { graphql } from '$graphql';
  import { Helmet } from '$lib/components';
  import { TiptapEditor, TiptapRenderer } from '$lib/tiptap';
  import { css } from '$styled-system/css';
  import { center, flex } from '$styled-system/patterns';
  import { token } from '$styled-system/tokens';
  import { YState } from '../(dashboard)/[slug]/state.svelte';
  import Toolbar from '../(dashboard)/[slug]/Toolbar.svelte';
  import { Highlight } from './highlight';
  import type { Editor } from '@tiptap/core';
  import type { Ref } from '$lib/utils';

  const query = graphql(`
    query IndexPage_Query {
      me {
        id
      }

      welcome {
        body
        bodyMobile
        update
        updateMobile
      }

      randomName
    }
  `);

  let editor = $state<Ref<Editor>>();
  let loaded = $state(false);
  let highlight = $state(false);

  const doc = new Y.Doc();
  const awareness = new YAwareness.Awareness(doc);

  const maxWidth = new YState<number>(doc, 'maxWidth', 800);

  onMount(() => {
    Y.applyUpdateV2(doc, base64.parse($query.welcome.update), 'remote');
    loaded = true;

    setTimeout(() => {
      highlight = true;
    }, 500);
  });
</script>

<Helmet
  description="창작자가 기다려온 글쓰기 앱 타이피를 만나보세요. 기본적인 텍스트 편집은 물론, 다양한 꾸밈 요소와 글쓰기 편의 기능으로 작품의 완성도를 높이고 나만의 개성을 더할 수 있어요."
  image={{ src: 'https://cdn.typie.net/opengraph/default.png', size: 'large' }}
  struct={{ '@context': 'https://schema.org', '@type': 'WebSite', name: '타이피', alternateName: 'typie', url: 'https://typie.co/' }}
  title="타이피 - 쓰고, 공유하고, 정리하는 글쓰기 공간"
  trailing={null}
/>

{#if loaded}
  <div
    class={center({ flexDirection: 'column', position: 'fixed', top: '0', insetX: '0', zIndex: '40', pointerEvents: 'none' })}
    in:fly={{ y: -10, easing: sineOut }}
  >
    <div
      class={css({
        borderWidth: '1px',
        borderTopWidth: '0',
        borderBottomRadius: '12px',
        width: 'full',
        maxWidth: '1000px',
        backgroundColor: 'surface.default',
        boxShadow: 'small',
        overflow: 'hidden',
        pointerEvents: 'auto',
      })}
    >
      <div class={flex({ justifyContent: 'space-between', alignItems: 'center', paddingX: '16px', paddingY: '8px' })}>
        <Logo class={css({ height: '20px' })} />

        <a
          style:--background-color={token('colors.accent.brand.default')}
          style:--border-color={token('colors.accent.brand.default')}
          style:--border-accent-color={token('colors.surface.default')}
          class={css({
            borderWidth: '2px',
            borderColor: 'transparent',
            borderRadius: '4px',
            paddingX: '12px',
            paddingY: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'text.bright',
            background:
              '[linear-gradient(var(--background-color), var(--background-color)) padding-box, conic-gradient(from var(--angle), var(--border-color), var(--border-accent-color) 10%, var(--border-color) 20%) border-box]',
            animationName: '[rotate]',
            animationDuration: '2s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            _hover: { animationPlayState: 'paused' },
          })}
          href={env.PUBLIC_AUTH_URL}
        >
          시작하기
        </a>
      </div>

      <div class={css({ height: '1px', backgroundColor: 'interactive.hover' })}></div>

      <Toolbar style={css.raw({ hideBelow: 'md' })} {doc} {editor} />
    </div>
  </div>
{/if}

<div
  style:--grid-line-color={token('colors.decoration.grid.default')}
  style:--cross-line-color={token('colors.decoration.grid.subtle')}
  style:--grid-size="30px"
  style:--line-thickness="1px"
  class={flex({
    flexDirection: 'column',
    alignItems: 'center',
    width: '[100dvw]',
    height: '[100dvh]',
    backgroundColor: 'surface.default',
    backgroundImage:
      '[repeating-linear-gradient(0deg, transparent, transparent calc(var(--grid-size) - var(--line-thickness)), var(--grid-line-color) calc(var(--grid-size) - var(--line-thickness)), var(--grid-line-color) var(--grid-size)), repeating-linear-gradient(90deg, transparent, transparent calc(var(--grid-size) - var(--line-thickness)), var(--grid-line-color) calc(var(--grid-size) - var(--line-thickness)), var(--grid-line-color) var(--grid-size)), repeating-linear-gradient(0deg, transparent, transparent calc(var(--grid-size) / 2 - var(--line-thickness)), var(--cross-line-color) calc(var(--grid-size) / 2 - var(--line-thickness)), var(--cross-line-color) calc(var(--grid-size) / 2), transparent calc(var(--grid-size) / 2), transparent var(--grid-size)), repeating-linear-gradient(90deg, transparent, transparent calc(var(--grid-size) / 2 - var(--line-thickness)), var(--cross-line-color) calc(var(--grid-size) / 2 - var(--line-thickness)), var(--cross-line-color) calc(var(--grid-size) / 2), transparent calc(var(--grid-size) / 2), transparent var(--grid-size))]',
    backgroundSize: 'var(--grid-size) var(--grid-size)',
    overflowY: 'auto',
  })}
>
  <div
    style:--prosemirror-max-width={`${maxWidth.current}px`}
    class={flex({ paddingTop: '240px', width: 'full', maxWidth: '1000px', hideBelow: 'md' })}
  >
    {#if browser}
      <div
        style:--highlight-progress={highlight ? '1' : '0'}
        style:--highlight-name={`"${$query.randomName}"`}
        class={css({ display: 'contents', '& a': { cursor: 'pointer' } })}
        onclick={(e) => {
          const anchor = (e.target as HTMLElement).closest('a');
          if (anchor) {
            e.preventDefault();
            window.open(anchor.href, '_blank');
          }
        }}
        role="none"
      >
        <TiptapEditor style={css.raw({ width: 'full' })} {awareness} {doc} extensions={[Highlight]} bind:editor />
      </div>
    {:else}
      <TiptapRenderer style={css.raw({ width: 'full', paddingBottom: '80px' })} content={$query.welcome.body} />
    {/if}
  </div>

  <div style:--prosemirror-max-width="100%" class={css({ paddingTop: '120px', paddingX: '16px', width: 'full', hideFrom: 'md' })}>
    <div
      style:--highlight-progress={highlight ? '1' : '0'}
      style:--highlight-name={`"${$query.randomName}"`}
      class={css({ display: 'contents', '& a': { cursor: 'pointer' } })}
      onclick={(e) => {
        const anchor = (e.target as HTMLElement).closest('a');
        if (anchor) {
          e.preventDefault();
          window.open(anchor.href, '_blank');
        }
      }}
      role="none"
    >
      <TiptapRenderer
        style={css.raw({ width: 'full', paddingBottom: '80px' })}
        content={$query.welcome.bodyMobile}
        extensions={[Highlight]}
      />
    </div>
  </div>
</div>

<style>
  @keyframes -global-rotate {
    to {
      --angle: 360deg;
    }
  }

  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
</style>
