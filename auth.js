async function sendMagicLink(email) {
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname
    }
  });

  return { error };
}

async function getCurrentUser() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }

  return data.user;
}

async function signOutUser() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
  }
}

function listenForAuthChanges(onChange) {
  supabaseClient.auth.onAuthStateChange(async () => {
    const user = await getCurrentUser();
    onChange(user);
  });
}