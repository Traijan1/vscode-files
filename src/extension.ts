import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "files" is now active!');

    context.subscriptions.push(vscode.commands.registerCommand("files.createFile", async () => await create("File", createFile)));
    context.subscriptions.push(vscode.commands.registerCommand("files.createFolder", async () => await create("Folder", createFolder)));
}

export function deactivate() {}

async function create(what: string, fn: Function) {
    let name = await vscode.window.showInputBox({
        title: `Create ${what}`,
        placeHolder: `Enter the ${what}name..`
    });

    if(name === undefined)
        return;
    
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if(workspaceFolders === undefined) {
        return;
    }

    if(workspaceFolders.length == 1) {
        await fn(name, workspaceFolders[0]);
    }
    else {
        let items: string[] = [];

        for(const workspace of workspaceFolders)
            items.push(workspace.name);

        let workspaceName = await vscode.window.showQuickPick(items, {
            canPickMany: false
        });

        let workspace = workspaceFolders.find((workspace, index, _) => workspace.name == workspaceName);

        if(workspace === undefined)
            return;

        await fn(name, workspace);
    }
}

async function createFile(filename: string, workspace: vscode.WorkspaceFolder) {
    let uri = vscode.Uri.parse(`${workspace.uri}`);
    let foldername = await getFolders(uri);

    await vscode.workspace.fs.writeFile(vscode.Uri.parse(`${foldername}/${filename}`), new Uint8Array());
}

async function createFolder(foldername: string, workspace: vscode.WorkspaceFolder) {
    let uri = vscode.Uri.parse(`${workspace.uri}`);
    let folders = await getFolders(uri);

    await vscode.workspace.fs.createDirectory(vscode.Uri.parse(`${folders}/${foldername}`));
}

async function getFolders(uri: vscode.Uri): Promise<vscode.Uri | undefined> {
    let items = await vscode.workspace.fs.readDirectory(uri);
    let folders: string[] = [""];

    for(const item of items) {
        if(item[1] == vscode.FileType.Directory)
            folders.push(item[0]);
    }

    if(folders.length == 1) 
        return uri;

    let foldername = await vscode.window.showQuickPick(folders, { canPickMany: false });

    if(foldername === undefined) 
        return undefined;

    if(foldername != "")
        return await getFolders(vscode.Uri.parse(uri.path + "/" + foldername));

    return uri;
}