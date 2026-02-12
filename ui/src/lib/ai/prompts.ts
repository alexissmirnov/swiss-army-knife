export const systemPrompt = ({
  selectedChatModel: _selectedChatModel,
}: {
  selectedChatModel: string;
}) => {
  return "You are a helpful assistant. Keep responses concise and clear.";
};
