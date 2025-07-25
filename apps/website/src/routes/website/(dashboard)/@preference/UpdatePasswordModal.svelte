<script lang="ts">
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { TypieError } from '@/errors';
  import { graphql } from '$graphql';
  import { Button, Modal, TextInput } from '$lib/components';
  import { createForm, FormError } from '$lib/form';
  import { css } from '$styled-system/css';
  import { flex } from '$styled-system/patterns';

  type Props = {
    open: boolean;
    hasPassword: boolean;
  };

  let { open = $bindable(), hasPassword }: Props = $props();

  const passwordSchema = z.string({ error: '비밀번호를 입력해주세요.' }).min(1, '비밀번호를 입력해주세요.');

  const updatePassword = graphql(`
    mutation UpdatePasswordModal_UpdatePassword_Mutation($input: UpdatePasswordInput!) {
      updatePassword(input: $input) {
        id
        hasPassword
      }
    }
  `);

  const form = createForm({
    schema: z
      .object({
        currentPassword: hasPassword ? passwordSchema : passwordSchema.optional(),
        newPassword: passwordSchema,
        confirmPassword: passwordSchema,
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: '비밀번호가 일치하지 않아요',
        path: ['confirmPassword'],
      }),
    onSubmit: async (data) => {
      await updatePassword({
        currentPassword: hasPassword ? data.currentPassword : undefined,
        newPassword: data.newPassword,
      });

      mixpanel.track('update_password', { hadPassword: hasPassword });
      open = false;
    },
    onError: (error) => {
      if (error instanceof TypieError) {
        if (error.code === 'invalid_password') {
          throw new FormError('currentPassword', '비밀번호가 일치하지 않습니다.');
        } else if (error.code === 'current_password_required') {
          throw new FormError('currentPassword', '현재 비밀번호를 입력해주세요.');
        }
      }
    },
  });

  $effect(() => {
    if (!open) {
      form.reset();
    }
  });
</script>

<Modal style={css.raw({ width: '448px' })} bind:open>
  <form class={flex({ direction: 'column', gap: '16px', padding: '24px' })} onsubmit={form.handleSubmit}>
    <h1 class={css({ fontSize: '20px', fontWeight: 'semibold' })}>
      비밀번호 {hasPassword ? '변경' : '설정'}
    </h1>

    {#if hasPassword}
      <div class={flex({ direction: 'column', gap: '8px' })}>
        <label class={css({ fontSize: '14px', fontWeight: 'medium', color: 'text.default' })} for="currentPassword">현재 비밀번호</label>
        <TextInput id="currentPassword" placeholder="현재 비밀번호를 입력하세요" type="password" bind:value={form.fields.currentPassword} />
        {#if form.errors.currentPassword}
          <div class={css({ paddingLeft: '4px', fontSize: '12px', color: 'text.danger' })}>{form.errors.currentPassword}</div>
        {/if}
      </div>
    {/if}

    <div class={flex({ direction: 'column', gap: '8px' })}>
      <label class={css({ fontSize: '14px', fontWeight: 'medium', color: 'text.default' })} for="newPassword">새 비밀번호</label>
      <TextInput id="newPassword" placeholder="********" type="password" bind:value={form.fields.newPassword} />
      {#if form.errors.newPassword}
        <div class={css({ paddingLeft: '4px', fontSize: '12px', color: 'text.danger' })}>{form.errors.newPassword}</div>
      {/if}
    </div>

    <div class={flex({ direction: 'column', gap: '8px' })}>
      <label class={css({ fontSize: '14px', fontWeight: 'medium', color: 'text.default' })} for="confirmPassword">새 비밀번호 확인</label>
      <TextInput id="confirmPassword" placeholder="********" type="password" bind:value={form.fields.confirmPassword} />
      {#if form.errors.confirmPassword}
        <div class={css({ paddingLeft: '4px', fontSize: '12px', color: 'text.danger' })}>{form.errors.confirmPassword}</div>
      {/if}
    </div>

    <div class={flex({ gap: '8px', marginTop: '8px' })}>
      <Button
        style={css.raw({ flex: '1' })}
        onclick={() => {
          open = false;
        }}
        type="button"
        variant="secondary"
      >
        취소
      </Button>
      <Button style={css.raw({ flex: '1' })} type="submit">
        {hasPassword ? '변경' : '설정'}
      </Button>
    </div>
  </form>
</Modal>
