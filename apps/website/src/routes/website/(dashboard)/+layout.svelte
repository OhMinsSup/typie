<script lang="ts">
  import mixpanel from 'mixpanel-browser';
  import qs from 'query-string';
  import { untrack } from 'svelte';
  import Logo from '$assets/logos/logo.svg?component';
  import { graphql } from '$graphql';
  import { Button, HorizontalDivider } from '$lib/components';
  import { AdminImpersonateBanner } from '$lib/components/admin';
  import { setupAppContext } from '$lib/context';
  import { isMobileDevice } from '$lib/utils';
  import { css } from '$styled-system/css';
  import { center, flex } from '$styled-system/patterns';
  import { token } from '$styled-system/tokens';
  import ShareModal from './@share/ShareModal.svelte';
  import CommandPalette from './CommandPalette.svelte';
  import Sidebar from './Sidebar.svelte';

  let { children } = $props();

  const query = graphql(`
    query DashboardLayout_Query {
      me @required {
        id
        name
        email

        avatar {
          id
          url
        }

        sites {
          id
          name
        }

        ...DashboardLayout_Sidebar_user
        ...DashboardLayout_CommandPalette_user
      }

      ...DashboardLayout_Sidebar_query
      ...AdminImpersonateBanner_query
    }
  `);

  const siteUpdateStream = graphql(`
    subscription DashboardLayout_SiteUpdateStream($siteId: ID!) {
      siteUpdateStream(siteId: $siteId) {
        ... on Site {
          id

          ...DashboardLayout_EntityTree_site
        }

        ... on Entity {
          id
          state

          node {
            __typename

            ... on Folder {
              id
              name
            }

            ... on Post {
              id
              title

              characterCountChange {
                additions
                deletions
              }
            }

            ... on Canvas {
              id
              title
            }
          }
        }
      }
    }
  `);

  const siteUsageUpdateStream = graphql(`
    subscription DashboardLayout_SiteUsageUpdateStream($siteId: ID!) {
      siteUsageUpdateStream(siteId: $siteId) {
        ... on Site {
          id

          usage {
            totalCharacterCount
            totalBlobSize
          }
        }
      }
    }
  `);

  setupAppContext($query.me.id);

  $effect(() => {
    return untrack(() => {
      const unsubscribe = siteUpdateStream.subscribe({ siteId: $query.me.sites[0].id });
      const unsubscribe2 = siteUsageUpdateStream.subscribe({ siteId: $query.me.sites[0].id });

      return () => {
        unsubscribe();
        unsubscribe2();
      };
    });
  });

  $effect(() => {
    if ($query.me) {
      mixpanel.identify($query.me.id);

      mixpanel.people.set({
        $email: $query.me.email,
        $name: $query.me.name,
        $avatar: qs.stringifyUrl({ url: $query.me.avatar.url, query: { s: 256, f: 'png' } }),
      });
    }
  });
</script>

{#if isMobileDevice()}
  <div
    style:--grid-line-color={token('colors.decoration.grid.brand')}
    style:--cross-line-color={token('colors.decoration.grid.brand.subtle')}
    style:--grid-size="30px"
    style:--line-thickness="1px"
    class={center({
      width: '[100dvw]',
      height: '[100dvh]',
      overflowY: 'auto',
      backgroundColor: 'surface.default',
      backgroundImage:
        '[repeating-linear-gradient(0deg, transparent, transparent calc(var(--grid-size) - var(--line-thickness)), var(--grid-line-color) calc(var(--grid-size) - var(--line-thickness)), var(--grid-line-color) var(--grid-size)), repeating-linear-gradient(90deg, transparent, transparent calc(var(--grid-size) - var(--line-thickness)), var(--grid-line-color) calc(var(--grid-size) - var(--line-thickness)), var(--grid-line-color) var(--grid-size)), repeating-linear-gradient(0deg, transparent, transparent calc(var(--grid-size) / 2 - var(--line-thickness)), var(--cross-line-color) calc(var(--grid-size) / 2 - var(--line-thickness)), var(--cross-line-color) calc(var(--grid-size) / 2), transparent calc(var(--grid-size) / 2), transparent var(--grid-size)), repeating-linear-gradient(90deg, transparent, transparent calc(var(--grid-size) / 2 - var(--line-thickness)), var(--cross-line-color) calc(var(--grid-size) / 2 - var(--line-thickness)), var(--cross-line-color) calc(var(--grid-size) / 2), transparent calc(var(--grid-size) / 2), transparent var(--grid-size))]',
      backgroundSize: 'var(--grid-size) var(--grid-size)',
    })}
  >
    <div
      class={flex({
        flexDirection: 'column',
        gap: '24px',
        borderRadius: '12px',
        margin: '20px',
        padding: { base: '24px', lg: '48px' },
        width: 'full',
        maxWidth: '400px',
        backgroundColor: 'surface.default',
        boxShadow: 'medium',
      })}
    >
      <div class={flex({ justifyContent: 'flex-start' })}>
        <Logo class={css({ height: '32px' })} />
      </div>

      <div class={flex({ flexDirection: 'column', gap: '4px', wordBreak: 'keep-all' })}>
        <h1 class={css({ fontSize: { base: '22px', lg: '24px' }, fontWeight: 'extrabold' })}>
          타이피 앱에서
          <br />
          글쓰기를 이어가 보세요
        </h1>

        <div class={css({ fontSize: { base: '13px', lg: '14px' }, color: 'text.faint' })}>
          모바일에서도 타이피의 몰입감 있는 글쓰기 환경을 그대로 이용하실 수 있어요.
        </div>
      </div>

      <div class={css({ borderRadius: '8px', paddingY: '8px', textAlign: 'center', backgroundColor: 'surface.subtle' })}>
        <p class={css({ fontSize: '13px', color: 'text.faint' })}>현재 로그인 정보</p>
        <p class={css({ marginTop: '2px', fontSize: '14px' })}>{$query.me.email}</p>
      </div>

      <HorizontalDivider color="secondary" />

      <Button style={css.raw({ width: 'full' })} external href="https://typie.link" size="lg" type="link" variant="secondary">
        타이피 앱 다운로드
      </Button>
    </div>
  </div>
{:else}
  <div class={flex({ flexDirection: 'column', height: '[100dvh]' })}>
    <AdminImpersonateBanner {$query} />

    <div
      class={flex({
        position: 'relative',
        flexGrow: '1',
        alignItems: 'stretch',
        backgroundColor: 'surface.muted',
        overflow: 'hidden',
      })}
    >
      <Sidebar {$query} $user={$query.me} />

      <div
        class={css({
          flexGrow: '1',
          borderWidth: '[0.5px]',
          borderRadius: '4px',
          marginY: '8px',
          marginRight: '8px',
          backgroundColor: 'surface.default',
          boxShadow: '[0 3px 6px -2px {colors.shadow.default/3}, 0 1px 1px {colors.shadow.default/5}]',
          overflowY: 'auto',
        })}
      >
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<CommandPalette $user={$query.me} />
<ShareModal />
