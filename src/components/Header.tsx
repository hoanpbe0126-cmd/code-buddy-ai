import { Moon, Sun, Palette, Code2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const colorOptions = [
  { value: 'green', label: 'Xanh lá', color: 'bg-emerald-500' },
  { value: 'blue', label: 'Xanh dương', color: 'bg-blue-500' },
  { value: 'orange', label: 'Cam', color: 'bg-orange-500' },
  { value: 'pink', label: 'Hồng', color: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
  { value: 'violet', label: 'Tím', color: 'bg-violet-500' },
] as const;

export const Header = () => {
  const { theme, colorTheme, toggleTheme, setColorTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Code Review AI</h1>
            <p className="text-xs text-muted-foreground">Đánh giá & tối ưu code</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Palette className="h-5 w-5" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${colorOptions.find(c => c.value === colorTheme)?.color}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {colorOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setColorTheme(option.value)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className={`w-4 h-4 rounded-full ${option.color}`} />
                  <span>{option.label}</span>
                  {colorTheme === option.value && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative overflow-hidden"
          >
            <Sun className={`h-5 w-5 transition-all duration-300 ${theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
            <Moon className={`absolute h-5 w-5 transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
          </Button>
        </div>
      </div>
    </header>
  );
};
