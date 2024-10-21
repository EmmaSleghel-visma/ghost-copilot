import * as vscode from "vscode";
import axios from "axios";

export function activate(context: vscode.ExtensionContext) {
  const ghost = vscode.chat.createChatParticipant("ghost-demo-ext", handler);
  ghost.iconPath = vscode.Uri.joinPath(context.extensionUri, "ghost.png");
}

const handler: vscode.ChatRequestHandler = async (
  request,
  context,
  responseStream,
  cancellationToken
) => {
  const userQuery = request.prompt;
  const teamContext = await getTeamContext();
  const chatModels = await vscode.lm.selectChatModels({ family: "gpt-4" });
  const messages = [
    vscode.LanguageModelChatMessage.User(userQuery + " " + JSON.stringify(teamContext)),
    vscode.LanguageModelChatMessage.User("Ensure that the JQL you retrieve is wrapped with <jql> tags"),
  ];
  let response = "";
  const chatResponse = await chatModels[0].sendRequest(
    messages,
    undefined,
    cancellationToken
  );
  for await (const word of chatResponse.text) {
    responseStream.markdown(word);
    response += word;
  }
  const jql = getJqlFromResponse(response);
  if(jql){
    responseStream.button({
      title: 'Execute',
      command: 'jira-ext.executeJql',
      arguments: [jql]
    });
  }
};

async function getTeamContext(): Promise<any> {
  const response = await axios.get("demoUrl");
  return response.data;
}

function getJqlFromResponse(response: string){
  const regex = /<jql>\s*(.*?)\s*<\/jql>/s;
  const found = response.match(regex);
  return found ? found[1] : null;
}

// This method is called when your extension is deactivated
export function deactivate() {}
