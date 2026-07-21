import React from "react";
import LoginClient from "./LoginClient";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; institute?: string }>;
}) {
  const searchParams = await props.searchParams;
  return (
    <LoginClient
      errorParam={searchParams.error}
      instituteParam={searchParams.institute}
    />
  );
}
