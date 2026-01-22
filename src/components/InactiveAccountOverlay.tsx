import { useEffect, useState } from 'react';
import { Lock, LogOut, Phone, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

interface AdminInfo {
  nome: string | null;
  telefone: string | null;
  email: string | null;
}

export function InactiveAccountOverlay() {
  const { signOut } = useAuth();
  const { imobiliariaId } = useUserRole();
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminInfo() {
      if (!imobiliariaId) {
        setLoading(false);
        return;
      }

      try {
        // First get the admin user_id using the helper function
        const { data: adminUserId, error: adminError } = await supabase
          .rpc('get_imobiliaria_admin', { imob_id: imobiliariaId });

        if (adminError || !adminUserId) {
          console.error('Error fetching admin:', adminError);
          setLoading(false);
          return;
        }

        // Then fetch the admin's profile info
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nome, telefone, email')
          .eq('user_id', adminUserId)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching admin profile:', profileError);
        } else if (profile) {
          setAdminInfo(profile);
        }
      } catch (error) {
        console.error('Error in fetchAdminInfo:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminInfo();
  }, [imobiliariaId]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-destructive/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Conta Inativa
          </CardTitle>
          <CardDescription className="text-base">
            Sua conta foi desativada. Entre em contato com o administrador da sua imobiliária para reativar o acesso.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground text-sm">
              Carregando informações de contato...
            </div>
          ) : adminInfo ? (
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">
                Contato do Administrador:
              </p>
              
              {adminInfo.nome && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{adminInfo.nome}</span>
                </div>
              )}
              
              {adminInfo.telefone && (
                <a 
                  href={`https://wa.me/55${adminInfo.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  <span>{adminInfo.telefone}</span>
                </a>
              )}
              
              {adminInfo.email && (
                <a 
                  href={`mailto:${adminInfo.email}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  <span>{adminInfo.email}</span>
                </a>
              )}
            </div>
          ) : !imobiliariaId ? (
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Entre em contato com o suporte para reativar sua conta.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar as informações de contato. Tente novamente mais tarde.
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
