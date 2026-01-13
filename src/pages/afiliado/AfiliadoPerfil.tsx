import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AfiliadoLayout } from '@/components/layouts/AfiliadoLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, Phone, Key, Mail, Calendar, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/phone';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AfiliadoPerfil() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: afiliado, isLoading } = useQuery({
    queryKey: ['afiliado-perfil', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('afiliados')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [telefone, setTelefone] = useState('');
  const [pixChave, setPixChave] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync form state when data loads
  useState(() => {
    if (afiliado) {
      setTelefone(afiliado.telefone || '');
      setPixChave(afiliado.pix_chave || '');
    }
  });

  // Update form when afiliado data changes
  if (afiliado && !isEditing && telefone === '' && pixChave === '') {
    setTelefone(afiliado.telefone || '');
    setPixChave(afiliado.pix_chave || '');
  }

  const updateMutation = useMutation({
    mutationFn: async (data: { telefone: string; pix_chave: string }) => {
      if (!afiliado) throw new Error('Afiliado não encontrado');
      
      const { error } = await supabase
        .from('afiliados')
        .update({
          telefone: data.telefone || null,
          pix_chave: data.pix_chave || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', afiliado.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afiliado-perfil'] });
      toast.success('Dados atualizados com sucesso!');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar dados');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ senhaAtual, novaSenha }: { senhaAtual: string; novaSenha: string }) => {
      // Primeiro, verifica a senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: senhaAtual,
      });
      
      if (signInError) {
        throw new Error('Senha atual incorreta');
      }

      // Atualiza a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setIsChangingPassword(false);
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ telefone, pix_chave: pixChave });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    changePasswordMutation.mutate({ senhaAtual, novaSenha });
  };

  const handleCancel = () => {
    setTelefone(afiliado?.telefone || '');
    setPixChave(afiliado?.pix_chave || '');
    setIsEditing(false);
  };

  const handleCancelPassword = () => {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setIsChangingPassword(false);
  };

  if (isLoading) {
    return (
      <AfiliadoLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AfiliadoLayout>
    );
  }

  if (!afiliado) {
    return (
      <AfiliadoLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Perfil de afiliado não encontrado.</p>
        </div>
      </AfiliadoLayout>
    );
  }

  return (
    <AfiliadoLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações de afiliado</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações da Conta
              </CardTitle>
              <CardDescription>Dados básicos do seu cadastro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{afiliado.nome}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{afiliado.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Membro desde</p>
                  <p className="font-medium">
                    {format(new Date(afiliado.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className={`h-4 w-4 ${afiliado.ativo ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`font-medium ${afiliado.ativo ? 'text-green-600' : 'text-red-600'}`}>
                    {afiliado.ativo ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Editáveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Dados de Pagamento
              </CardTitle>
              <CardDescription>Informações para recebimento de comissões</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone / WhatsApp
                  </Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => {
                      setIsEditing(true);
                      setTelefone(formatPhone(e.target.value));
                    }}
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado para contato e notificações
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Chave PIX
                  </Label>
                  <Input
                    id="pix"
                    type="text"
                    placeholder="CPF, email, telefone ou chave aleatória"
                    value={pixChave}
                    onChange={(e) => {
                      setIsEditing(true);
                      setPixChave(e.target.value);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Para recebimento das comissões
                  </p>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="flex-1"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>Atualize sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button 
                  variant="outline" 
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full sm:w-auto"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar minha senha
                </Button>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="senhaAtual">Senha Atual</Label>
                    <Input
                      id="senhaAtual"
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Digite sua senha atual"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="novaSenha">Nova Senha</Label>
                    <Input
                      id="novaSenha"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a nova senha"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Nova Senha
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelPassword}
                      disabled={changePasswordMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dicas */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Importante sobre a Chave PIX</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Mantenha sua chave PIX sempre atualizada para garantir o recebimento correto das comissões. 
                  As comissões são pagas mensalmente após a confirmação do pagamento das assinaturas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AfiliadoLayout>
  );
}
