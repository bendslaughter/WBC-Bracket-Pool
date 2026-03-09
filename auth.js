async function sendMagicLink(email) {
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname
    }
  });

  return { error };
}

async function signInWithProvider(provider) {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });

  return { error };
}

async function getCurrentUser() {
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error("Error getting session:", sessionError);
    return null;
  }

  if (!sessionData.session) {
    return null;
  }

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

function openAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.classList.add("hidden");
}

function setupAuthModalControls() {
  const openBtn = document.getElementById("open-auth-modal");
  const closeBtn = document.getElementById("close-auth-modal");
  const backdrop = document.querySelector(".auth-modal__backdrop");

  if (openBtn) {
    openBtn.addEventListener("click", openAuthModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeAuthModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeAuthModal);
  }
}