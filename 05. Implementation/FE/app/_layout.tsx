import { Stack } from "expo-router";
import "../global.css"

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screens/login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screens/register"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screens/dashboard"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
