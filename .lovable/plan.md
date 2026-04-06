
Objetivo: fazer o painel de atualização desaparecer sozinho em no máximo 10 segundos, evitando que o usuário fique preso no modal caso a atualização/reload não aconteça como esperado.

1. Ajustar o fluxo do componente global de atualização
- Trabalhar em `src/components/VersionCheckWithOverlay.tsx`, que é o componente atualmente renderizado em `src/App.tsx`.
- Manter a lógica atual de detectar nova versão e iniciar o countdown.
- Adicionar um “timeout de segurança” de até 10 segundos a partir da abertura do overlay.

2. Fechamento automático do overlay
- Quando `showOverlay` virar `true`, iniciar um timer único de 10 segundos.
- Se dentro desse período o app recarregar, nada muda.
- Se o reload falhar, atrasar, ou o modal continuar aberto por qualquer motivo, encerrar o estado do overlay automaticamente com `setShowOverlay(false)` e resetar o countdown.
- Limpar esse timer ao fechar o overlay ou desmontar o componente para evitar vazamento de timers.

3. Preservar o comportamento principal
- Continuar tentando atualizar automaticamente quando o countdown chegar a 0.
- Não mexer na edge function, no banco, nem em RLS.
- Não alterar o `PWAUpdatePrompt` agora, porque o problema mostrado na imagem é o modal de `VersionCheckWithOverlay`, não o toast do service worker.

4. Pequeno refinamento de UX
- Garantir que, se o modal for fechado pelo timeout de segurança, ele não reapareça instantaneamente no mesmo ciclo de foco/checagem.
- Usar o mesmo reset já existente do countdown para que a próxima abertura comece limpa.

5. Validação após implementar
- Testar o fluxo em produção/publicado ou contexto equivalente de usuário autenticado.
- Confirmar dois cenários:
  - atualização funciona e a página recarrega antes de 10s;
  - atualização não conclui, e o painel some sozinho em até 10s.

Detalhes técnicos
- Arquivo principal: `src/components/VersionCheckWithOverlay.tsx`
- Estado já existente: `showOverlay`, `countdown`, `deferredUntilRef`
- Mudança central: novo `useEffect` ou timer controlado por `showOverlay` para auto-fechamento
- Escopo: frontend apenas, sem migration, sem policies, sem backend

<lov-actions>
<lov-suggestion message="Test the update overlay end-to-end on mobile and desktop to confirm it disappears automatically within 10 seconds if the refresh does not complete.">Verify that it works</lov-suggestion>
<lov-suggestion message="Implement the 10-second safety timeout in the global update overlay component so the panel closes itself automatically if the refresh flow gets stuck.">Implement the 10s auto-close</lov-suggestion>
<lov-suggestion message="Refine the update overlay copy and states so users understand when the app is updating, when it failed, and when the modal closes automatically.">Improve update UX</lov-suggestion>
</lov-actions>
