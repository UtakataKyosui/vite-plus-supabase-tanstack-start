import { Link, redirect, createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useMutation } from "../hooks/useMutation";
import { Auth } from "../components/auth/auth-card";
import { getSupabaseServerClient } from "../utils/supabase";

export const signupFn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string; redirectUrl?: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }

    // Redirect to the prev page stored in the "redirect" search param
    throw redirect({
      href: data.redirectUrl || "/",
    });
  });

export const Route = createFileRoute("/signup")({
  component: SignupComp,
});

function SignupComp() {
  const signupMutation = useMutation({
    fn: useServerFn(signupFn),
  });

  return (
    <Auth
      actionText="Sign up"
      description="Create an account to start tracking your items."
      autoComplete="new-password"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
      status={signupMutation.status}
      onSubmit={(e) => {
        const formData = new FormData(e.target as HTMLFormElement);

        signupMutation.mutate({
          data: {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            redirectUrl: "/dashboard",
          },
        });
      }}
      afterSubmit={
        signupMutation.data?.error ? (
          <>
            <div role="alert" className="text-sm text-destructive">
              {signupMutation.data.message}
            </div>
          </>
        ) : null
      }
    />
  );
}
