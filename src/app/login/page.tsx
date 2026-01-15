'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, UserCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useLocalization } from "@/components/layout/localization-provider";

export default function LoginPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLocalization();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const createUserProfileDocument = async (userCred: UserCredential) => {
        const isNewUser = getAdditionalUserInfo(userCred)?.isNewUser;
        if (!isNewUser) return; // Only create doc for new users
        const user = userCred.user;
        const userRef = doc(firestore, "users", user.uid);
        await setDoc(userRef, { 
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] 
        }, { merge: true });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({
                title: t.login.successTitle,
                description: t.login.successDescription,
            });
            router.push('/');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t.login.failTitle,
                description: t.login.failDescription,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            await createUserProfileDocument(userCredential);
            toast({
                title: t.googleAuth.successTitle,
                description: t.googleAuth.successDescription,
            });
            router.push('/');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t.googleAuth.failTitle,
                description: error.message || t.googleAuth.failDescription,
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <BrainCircuit className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-headline">{t.login.title}</CardTitle>
          <CardDescription>
            {t.login.description}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">{t.login.emailLabel}</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">{t.login.passwordLabel}</Label>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? t.login.signingIn : t.login.signInButton}
                </Button>
            </CardFooter>
        </form>
         <p className="mt-2 px-6 text-center text-sm text-muted-foreground">
              {t.login.noAccount}{' '}
              <Link
                href="/signup"
                className="underline underline-offset-4 hover:text-primary"
              >
                {t.login.signUpLink}
              </Link>
        </p>
        <div className="relative my-4 px-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t.login.orContinueWith}
            </span>
          </div>
        </div>
         <div className="p-6 pt-0">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? t.login.signingIn : t.googleAuth.signInButton}
            </Button>
        </div>
      </Card>
    </div>
  );
}
