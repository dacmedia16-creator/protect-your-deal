

# Plan: Replace Delete with Discard for Partner Fichas

## Problem
When a ficha belongs to a partner (i.e., `corretor_parceiro_id === user.id`), the delete button still shows. Partners should not be able to delete the ficha (they don't own it). Instead, they should see a "Discard" action that unlinks them from the ficha by setting `corretor_parceiro_id = null`.

## Changes

### 1. Create `DescartarFichaDialog` component
New file: `src/components/DescartarFichaDialog.tsx`
- Similar structure to `DeleteFichaDialog` but with different action and copy
- Title: "Descartar registro de parceria?"
- Description: explains that the user will be removed as partner but the ficha will continue existing
- Action: `UPDATE fichas_visita SET corretor_parceiro_id = null, parte_preenchida_parceiro = null WHERE id = fichaId`
- Icon: `UserMinus` or `Unlink` instead of `Trash2`
- Button style: warning/outline instead of destructive
- Toast: "Parceria descartada" with success message

### 2. Update `ListaFichas.tsx` — conditional render
In both mobile (line ~294) and desktop (line ~357) layouts:
- If `isParceiro` (i.e., `ficha.corretor_parceiro_id === user?.id`), render `<DescartarFichaDialog>` instead of `<DeleteFichaDialog>`
- Otherwise, keep `<DeleteFichaDialog>` as-is

### 3. Update `FichasParceiro.tsx` — add discard action
This page only shows partner fichas. Add a `<DescartarFichaDialog>` button to each card so partners can unlink themselves.

### 4. No database migration needed
The `corretor_parceiro_id` column already accepts null. The existing RLS policies for `fichas_visita` UPDATE should allow the partner to update their own linked fichas.

## Files touched
- `src/components/DescartarFichaDialog.tsx` (new)
- `src/pages/ListaFichas.tsx` (conditional render)
- `src/pages/FichasParceiro.tsx` (add discard button)

