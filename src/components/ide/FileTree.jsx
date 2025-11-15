import { useState } from "react";
import { FileCode, Folder, Plus, Trash2, Loader2, File, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LANGUAGE_CONFIG = {
  javascript: { ext: '.js', template: '// JavaScript file\nconsole.log("Hello, World!");\n', color: '#f7df1e' },
  typescript: { ext: '.ts', template: '// TypeScript file\nconsole.log("Hello, World!");\n', color: '#3178c6' },
  python: { ext: '.py', template: '# Python file\nprint("Hello, World!")\n', color: '#3776ab' },
  html: { ext: '.html', template: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>', color: '#e34c26' },
  css: { ext: '.css', template: '/* CSS file */\nbody {\n  margin: 0;\n  font-family: sans-serif;\n}\n', color: '#264de4' },
  java: { ext: '.java', template: '// Java file\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}', color: '#007396' },
  cpp: { ext: '.cpp', template: '// C++ file\n#include <iostream>\n\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}', color: '#00599c' },
  go: { ext: '.go', template: '// Go file\npackage main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello, World!")\n}', color: '#00add8' },
  rust: { ext: '.rs', template: '// Rust file\nfn main() {\n  println!("Hello, World!");\n}', color: '#ce412b' }
};

export default function FileTree({ files, currentFile, onFileSelect, onNewFile, onDeleteFile, isLoading, isCollapsed, onToggleCollapse }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('javascript');

  const handleDelete = (file, e) => {
    e.stopPropagation();
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      onDeleteFile(fileToDelete.id);
    }
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const handleCreateFile = () => {
    const config = LANGUAGE_CONFIG[newFileLanguage];
    const fileName = newFileName.trim() || `untitled${config.ext}`;
    const finalFileName = fileName.includes('.') ? fileName : fileName + config.ext;
    
    onNewFile({
      name: finalFileName,
      language: newFileLanguage,
      content: config.template
    });
    
    setCreateDialogOpen(false);
    setNewFileName('');
    setNewFileLanguage('javascript');
  };

  const getLanguageColor = (language) => {
    return LANGUAGE_CONFIG[language]?.color || '#858585';
  };

  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));

  if (isCollapsed) {
    return (
      <div className="w-10 bg-[#252526] border-r border-[#2d2d2d] flex flex-col items-center py-2 flex-shrink-0">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#858585] hover:text-white hover:bg-[#3d3d3d]"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </Button>
        <div className="mt-4 writing-mode-vertical text-[#858585] text-xs">
          Files
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#252526] border-r border-[#2d2d2d] flex flex-col flex-shrink-0 overflow-hidden">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#c586c0]" />
          <span className="text-white text-sm font-medium">Files</span>
          {files.length > 0 && (
            <span className="text-[#858585] text-xs">({files.length})</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-[#3d3d3d] transition-colors"
            title="Create new file"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#858585] hover:text-white hover:bg-[#3d3d3d]"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-[#569cd6] animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center">
            <File className="w-12 h-12 text-[#858585] mx-auto mb-3 opacity-30" />
            <p className="text-[#858585] text-sm mb-1">No files yet</p>
            <p className="text-[#858585] text-xs">Click + to create your first file</p>
          </div>
        ) : (
          <div className="p-2">
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onFileSelect(file)}
                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer group transition-all ${
                  currentFile?.id === file.id
                    ? 'bg-[#37373d] shadow-sm'
                    : 'hover:bg-[#2a2d2e]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileCode 
                    className="w-4 h-4 flex-shrink-0" 
                    style={{ color: getLanguageColor(file.language) }}
                  />
                  <span className="text-white text-sm truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <Button
                  onClick={(e) => handleDelete(file, e)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-red-500/20"
                  title="Delete file"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create File Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#252526] border-[#3d3d3d] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create New File</DialogTitle>
            <DialogDescription className="text-[#d4d4d4]">
              Choose a language and enter a file name
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-white">Language</Label>
              <Select value={newFileLanguage} onValueChange={setNewFileLanguage}>
                <SelectTrigger className="bg-[#2d2d2d] border-[#3d3d3d] text-white focus:border-[#569cd6]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#252526] text-white border-[#3d3d3d]">
                  {Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => (
                    <SelectItem key={lang} value={lang}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        {lang.charAt(0).toUpperCase() + lang.slice(1)} ({config.ext})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename" className="text-white">File Name</Label>
              <Input
                id="filename"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={`example${LANGUAGE_CONFIG[newFileLanguage].ext}`}
                className="bg-[#2d2d2d] border-[#3d3d3d] text-white placeholder:text-[#858585] focus:border-[#569cd6]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFile();
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewFileName('');
              }}
              className="bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFile}
              className="bg-[#0e639c] hover:bg-[#1177bb] text-white"
            >
              Create File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#252526] border-[#3d3d3d] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete File?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#d4d4d4]">
              Are you sure you want to delete <span className="font-semibold">"{fileToDelete?.name}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}