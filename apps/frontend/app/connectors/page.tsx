'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Grid,
  GridItem,
  Icon,
  Flex,
  Spacer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';

interface Connector {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  description: string;
  config: Record<string, any>;
  lastSync?: string;
  errorMessage?: string;
}

const CONNECTOR_TYPES = [
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support and help desk platform',
    icon: '🎫',
    fields: [
      { name: 'subdomain', label: 'Subdomain', type: 'text', required: true },
      { name: 'apiToken', label: 'API Token', type: 'password', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
    ],
  },
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Customer messaging and support platform',
    icon: '💬',
    fields: [
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { name: 'workspaceId', label: 'Workspace ID', type: 'text', required: true },
    ],
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    description: 'Customer support software',
    icon: '🆘',
    fields: [
      { name: 'domain', label: 'Domain', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
  },
  {
    id: 'jira',
    name: 'Jira Service Management',
    description: 'IT service management platform',
    icon: '🛠️',
    fields: [
      { name: 'domain', label: 'Domain', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'apiToken', label: 'API Token', type: 'password', required: true },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing platform',
    icon: '💳',
    fields: [
      { name: 'publishableKey', label: 'Publishable Key', type: 'text', required: true },
      { name: 'secretKey', label: 'Secret Key', type: 'password', required: true },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform',
    icon: '🛍️',
    fields: [
      { name: 'shopDomain', label: 'Shop Domain', type: 'text', required: true },
      { name: 'accessToken', label: 'Access Token', type: 'password', required: true },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM and business platform',
    icon: '☁️',
    fields: [
      { name: 'instanceUrl', label: 'Instance URL', type: 'text', required: true },
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing and sales platform',
    icon: '🎯',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'portalId', label: 'Portal ID', type: 'text', required: true },
    ],
  },
];

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([
    {
      id: '1',
      name: 'Main Zendesk',
      type: 'zendesk',
      status: 'connected',
      description: 'Primary customer support integration',
      config: { subdomain: 'company', email: 'support@company.com' },
      lastSync: '2024-01-20 14:30',
    },
    {
      id: '2',
      name: 'Intercom Support',
      type: 'intercom',
      status: 'error',
      description: 'Live chat integration',
      config: { workspaceId: 'abc123' },
      errorMessage: 'Invalid access token',
    },
  ]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleAddConnector = (typeId: string) => {
    setSelectedType(typeId);
    setFormData({});
    onOpen();
  };

  const handleSave = () => {
    const connectorType = CONNECTOR_TYPES.find(t => t.id === selectedType);
    if (!connectorType) return;

    const newConnector: Connector = {
      id: Date.now().toString(),
      name: formData.name || connectorType.name,
      type: selectedType,
      status: 'disconnected',
      description: formData.description || connectorType.description,
      config: formData,
    };

    setConnectors([...connectors, newConnector]);
    onClose();
  };

  const handleTestConnection = (connectorId: string) => {
    setConnectors(connectors.map(connector =>
      connector.id === connectorId
        ? { ...connector, status: 'connected' as const, lastSync: new Date().toISOString() }
        : connector
    ));
  };

  const handleDisconnect = (connectorId: string) => {
    setConnectors(connectors.map(connector =>
      connector.id === connectorId
        ? { ...connector, status: 'disconnected' as const, lastSync: undefined }
        : connector
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green';
      case 'disconnected': return 'gray';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getConnectorType = (typeId: string) => {
    return CONNECTOR_TYPES.find(t => t.id === typeId);
  };

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <Flex align="center">
          <Heading>Connectors</Heading>
          <Spacer />
          <Text fontSize="sm" color="gray.500">
            {connectors.filter(c => c.status === 'connected').length} connected
          </Text>
        </Flex>

        {/* Available Connectors */}
        <Card>
          <CardHeader>
            <Heading size="md">Available Integrations</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
              {CONNECTOR_TYPES.map((type) => (
                <GridItem key={type.id}>
                  <Card variant="outline" cursor="pointer" onClick={() => handleAddConnector(type.id)}>
                    <CardBody>
                      <HStack spacing={3}>
                        <Text fontSize="2xl">{type.icon}</Text>
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="medium">{type.name}</Text>
                          <Text fontSize="sm" color="gray.600">{type.description}</Text>
                        </VStack>
                        <AddIcon color="blue.500" />
                      </HStack>
                    </CardBody>
                  </Card>
                </GridItem>
              ))}
            </Grid>
          </CardBody>
        </Card>

        {/* Connected Connectors */}
        <Card>
          <CardHeader>
            <Heading size="md">Connected Integrations</Heading>
          </CardHeader>
          <CardBody>
            {connectors.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                No connectors configured yet. Add one from the available integrations above.
              </Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {connectors.map((connector) => {
                  const type = getConnectorType(connector.type);
                  return (
                    <Card key={connector.id} variant="outline">
                      <CardBody>
                        <HStack justify="space-between" align="start">
                          <HStack spacing={4} flex={1}>
                            <Text fontSize="2xl">{type?.icon}</Text>
                            <VStack align="start" spacing={1} flex={1}>
                              <HStack>
                                <Text fontWeight="medium">{connector.name}</Text>
                                <Badge colorScheme={getStatusColor(connector.status)}>
                                  {connector.status}
                                </Badge>
                              </HStack>
                              <Text fontSize="sm" color="gray.600">
                                {connector.description}
                              </Text>
                              {connector.lastSync && (
                                <Text fontSize="xs" color="gray.500">
                                  Last sync: {connector.lastSync}
                                </Text>
                              )}
                              {connector.errorMessage && (
                                <Alert status="error" size="sm" mt={2}>
                                  <AlertIcon />
                                  <AlertTitle>Error:</AlertTitle>
                                  <AlertDescription>{connector.errorMessage}</AlertDescription>
                                </Alert>
                              )}
                            </VStack>
                          </HStack>
                          <VStack spacing={2}>
                            {connector.status === 'connected' ? (
                              <Button size="sm" leftIcon={<CloseIcon />} onClick={() => handleDisconnect(connector.id)}>
                                Disconnect
                              </Button>
                            ) : (
                              <Button size="sm" leftIcon={<CheckIcon />} onClick={() => handleTestConnection(connector.id)}>
                                Test Connection
                              </Button>
                            )}
                            <Button size="sm" variant="outline" leftIcon={<ExternalLinkIcon />}>
                              Configure
                            </Button>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Add {getConnectorType(selectedType)?.name} Integration
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`${getConnectorType(selectedType)?.name} Integration`}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                />
              </FormControl>
              {getConnectorType(selectedType)?.fields.map((field) => (
                <FormControl key={field.name} isRequired={field.required}>
                  <FormLabel>{field.label}</FormLabel>
                  <Input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </FormControl>
              ))}
              <HStack spacing={4} w="full">
                <Button onClick={onClose} flex={1}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSave} flex={1}>
                  Add Integration
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
