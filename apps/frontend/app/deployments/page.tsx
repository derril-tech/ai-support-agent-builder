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
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Flex,
  Spacer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, CopyIcon, ViewIcon, EditIcon, DeleteIcon, ExternalLinkIcon } from '@chakra-ui/icons';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  environment: 'development' | 'staging' | 'production';
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

interface Deployment {
  id: string;
  name: string;
  environment: string;
  status: 'active' | 'inactive' | 'error';
  agentId: string;
  agentName: string;
  endpoint: string;
  createdAt: string;
  lastDeployed?: string;
}

export default function DeploymentsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk-prod-1234567890abcdef',
      environment: 'production',
      permissions: ['read', 'write'],
      createdAt: '2024-01-15',
      lastUsed: '2024-01-20 14:30',
      isActive: true,
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk-dev-abcdef1234567890',
      environment: 'development',
      permissions: ['read'],
      createdAt: '2024-01-10',
      isActive: true,
    },
  ]);

  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: '1',
      name: 'Customer Support Bot - Prod',
      environment: 'production',
      status: 'active',
      agentId: 'agent-1',
      agentName: 'Customer Support Bot',
      endpoint: 'https://api.company.com/v1/agents/customer-support',
      createdAt: '2024-01-15',
      lastDeployed: '2024-01-20 10:00',
    },
    {
      id: '2',
      name: 'Sales Assistant - Staging',
      environment: 'staging',
      status: 'inactive',
      agentId: 'agent-2',
      agentName: 'Sales Assistant',
      endpoint: 'https://staging-api.company.com/v1/agents/sales',
      createdAt: '2024-01-18',
    },
  ]);

  const { isOpen: isApiKeyOpen, onOpen: onApiKeyOpen, onClose: onApiKeyClose } = useDisclosure();
  const { isOpen: isDeploymentOpen, onOpen: onDeploymentOpen, onClose: onDeploymentClose } = useDisclosure();
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    environment: 'development',
    permissions: [] as string[],
  });

  const handleCreateApiKey = () => {
    setEditingApiKey(null);
    setFormData({ name: '', environment: 'development', permissions: [] });
    onApiKeyOpen();
  };

  const handleEditApiKey = (apiKey: ApiKey) => {
    setEditingApiKey(apiKey);
    setFormData({
      name: apiKey.name,
      environment: apiKey.environment,
      permissions: apiKey.permissions,
    });
    onApiKeyOpen();
  };

  const handleSaveApiKey = () => {
    if (editingApiKey) {
      setApiKeys(apiKeys.map(key =>
        key.id === editingApiKey.id
          ? { ...key, ...formData }
          : key
      ));
    } else {
      const newApiKey: ApiKey = {
        id: Date.now().toString(),
        name: formData.name,
        key: `sk-${formData.environment}-${Math.random().toString(36).substr(2, 9)}`,
        environment: formData.environment as 'development' | 'staging' | 'production',
        permissions: formData.permissions,
        createdAt: new Date().toISOString().split('T')[0],
        isActive: true,
      };
      setApiKeys([...apiKeys, newApiKey]);
    }
    onApiKeyClose();
  };

  const handleCreateDeployment = () => {
    setEditingDeployment(null);
    setFormData({ name: '', environment: 'development', permissions: [] });
    onDeploymentOpen();
  };

  const handleSaveDeployment = () => {
    if (editingDeployment) {
      setDeployments(deployments.map(deployment =>
        deployment.id === editingDeployment.id
          ? { ...deployment, ...formData }
          : deployment
      ));
    } else {
      const newDeployment: Deployment = {
        id: Date.now().toString(),
        name: formData.name,
        environment: formData.environment,
        status: 'inactive',
        agentId: 'agent-stub',
        agentName: 'Stub Agent',
        endpoint: `https://${formData.environment}-api.company.com/v1/agents/stub`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setDeployments([...deployments, newDeployment]);
    }
    onDeploymentClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <Flex align="center">
              <Heading size="md">API Keys</Heading>
              <Spacer />
              <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleCreateApiKey}>
                Create API Key
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Environment</Th>
                  <Th>API Key</Th>
                  <Th>Permissions</Th>
                  <Th>Last Used</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {apiKeys.map((apiKey) => (
                  <Tr key={apiKey.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{apiKey.name}</Text>
                        <Text fontSize="sm" color="gray.500">ID: {apiKey.id}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge variant="outline">{apiKey.environment}</Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <Code fontSize="sm" maxW="200px" isTruncated>
                          {apiKey.key}
                        </Code>
                        <Tooltip label="Copy to clipboard">
                          <IconButton
                            size="sm"
                            icon={<CopyIcon />}
                            aria-label="Copy API key"
                            onClick={() => copyToClipboard(apiKey.key)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} size="sm" variant="subtle">
                            {permission}
                          </Badge>
                        ))}
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{apiKey.lastUsed || 'Never'}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={apiKey.isActive ? 'green' : 'gray'}>
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="sm" leftIcon={<EditIcon />} onClick={() => handleEditApiKey(apiKey)}>
                          Edit
                        </Button>
                        <Button size="sm" leftIcon={<DeleteIcon />} colorScheme="red">
                          Revoke
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Deployments Section */}
        <Card>
          <CardHeader>
            <Flex align="center">
              <Heading size="md">Deployments</Heading>
              <Spacer />
              <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleCreateDeployment}>
                Create Deployment
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Environment</Th>
                  <Th>Agent</Th>
                  <Th>Status</Th>
                  <Th>Endpoint</Th>
                  <Th>Last Deployed</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {deployments.map((deployment) => (
                  <Tr key={deployment.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{deployment.name}</Text>
                        <Text fontSize="sm" color="gray.500">ID: {deployment.id}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge variant="outline">{deployment.environment}</Badge>
                    </Td>
                    <Td>
                      <Text>{deployment.agentName}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(deployment.status)}>
                        {deployment.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <Code fontSize="sm" maxW="200px" isTruncated>
                          {deployment.endpoint}
                        </Code>
                        <Tooltip label="Copy endpoint">
                          <IconButton
                            size="sm"
                            icon={<CopyIcon />}
                            aria-label="Copy endpoint"
                            onClick={() => copyToClipboard(deployment.endpoint)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{deployment.lastDeployed || 'Never'}</Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="sm" leftIcon={<ViewIcon />}>
                          View
                        </Button>
                        <Button size="sm" leftIcon={<EditIcon />}>
                          Edit
                        </Button>
                        <Button size="sm" leftIcon={<ExternalLinkIcon />}>
                          Deploy
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>

      {/* API Key Modal */}
      <Modal isOpen={isApiKeyOpen} onClose={onApiKeyClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingApiKey ? 'Edit API Key' : 'Create New API Key'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter API key name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Environment</FormLabel>
                <Select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Permissions</FormLabel>
                <VStack align="start" spacing={2}>
                  {['read', 'write', 'admin'].map((permission) => (
                    <Button
                      key={permission}
                      size="sm"
                      variant={formData.permissions.includes(permission) ? 'solid' : 'outline'}
                      onClick={() => {
                        const newPermissions = formData.permissions.includes(permission)
                          ? formData.permissions.filter(p => p !== permission)
                          : [...formData.permissions, permission];
                        setFormData({ ...formData, permissions: newPermissions });
                      }}
                    >
                      {permission}
                    </Button>
                  ))}
                </VStack>
              </FormControl>
              <HStack spacing={4} w="full">
                <Button onClick={onApiKeyClose} flex={1}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSaveApiKey} flex={1}>
                  {editingApiKey ? 'Update' : 'Create'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Deployment Modal */}
      <Modal isOpen={isDeploymentOpen} onClose={onDeploymentClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingDeployment ? 'Edit Deployment' : 'Create New Deployment'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter deployment name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Environment</FormLabel>
                <Select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Agent</FormLabel>
                <Select placeholder="Select an agent">
                  <option value="agent-1">Customer Support Bot</option>
                  <option value="agent-2">Sales Assistant</option>
                </Select>
              </FormControl>
              <HStack spacing={4} w="full">
                <Button onClick={onDeploymentClose} flex={1}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSaveDeployment} flex={1}>
                  {editingDeployment ? 'Update' : 'Create'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
