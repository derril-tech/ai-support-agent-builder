'use client';
import { Box, Heading, Stack, Switch, Text } from '@chakra-ui/react';

export default function SettingsPage() {
  return (
    <Box p={8}>
      <Heading mb={4}>Settings</Heading>
      <Stack>
        <Text>SSO</Text>
        <Switch>Enable SSO</Switch>
      </Stack>
    </Box>
  );
}
