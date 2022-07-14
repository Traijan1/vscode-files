import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "files" is now active!');

    context.subscriptions.push(vscode.commands.registerCommand("files.createFile", async () => await create("File", createFile)));
    context.subscriptions.push(vscode.commands.registerCommand("files.createFolder", async () => await create("Folder", createFolder)));
    context.subscriptions.push(vscode.commands.registerCommand("files.rename", async () => await rename(renameItem)));
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

async function rename(fn: Function) {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if(workspaceFolders === undefined) {
        return;
    }

    if(workspaceFolders.length == 1) {
        await fn(workspaceFolders[0]);
    }
    else {
        let items: string[] = [];

        for(const workspace of workspaceFolders)
            items.push(workspace.name);

        let workspaceName = await vscode.window.showQuickPick(items, { canPickMany: false });

        let workspace = workspaceFolders.find((workspace, index, _) => workspace.name == workspaceName);

        if(workspace === undefined)
            return;

        await fn(workspace);
    }
}

async function renameItem(workspace: vscode.WorkspaceFolder) {
    let uri = workspace.uri;

    let oldName = await getFiles(uri, vscode.FileType.Directory);

    let newName = await vscode.window.showInputBox({
        title: `Rename`,
        placeHolder: `Enter the new name..`
    });
    
    if(oldName === undefined)
        return undefined;

    const newPath = await getPathExceptLastItem(oldName);
    await vscode.workspace.fs.rename(vscode.Uri.parse(`${oldName}`), vscode.Uri.parse(`${newPath}/${newName}`));
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

async function getFiles(uri: vscode.Uri, type: vscode.FileType): Promise<string | undefined> {
    let items = await vscode.workspace.fs.readDirectory(uri);
    let files: string[] = [];

    const ifFolder = "Choose current folder";
    if(type == vscode.FileType.Directory)
        files.push(ifFolder);
    
    for(const item of items)
        files.push(item[0]);
    
    let name = await vscode.window.showQuickPick(files, { canPickMany: false });

    if(name === undefined) 
        return undefined;

    let item = await items.find((value, index, _) => value[0] == name);

    const newUri = vscode.Uri.parse(uri.path + "/" + name);

    if(type == vscode.FileType.Directory && name == ifFolder)
        return uri.toString();

    if(item === undefined)
        return undefined;

    if(item[1] == vscode.FileType.Directory)
        return await getFiles(newUri, type);

    return newUri.toString();
}

async function getPathExceptLastItem(uri: string): Promise<string> {
    let items = uri.split("/");
    items.pop();

    return items.join("/");
}