import { ReactNode } from "react"; // Importar ReactNode

interface BackPageProps {
    extraClassName?: string; // Hacer opcional el extraClassName
    children: ReactNode; // Definir children como un prop
    backButton?: ReactNode; // Prop opcional para el botón de retroceso
}

export function Page({ extraClassName, children, backButton }: BackPageProps) {
    return (
        <section className={`w-full min-h-screen flex flex-col bg-gray-200 ${extraClassName}`}>
            <header className="bg-blue-700 w-full h-[16vh] flex items-center justify-center relative">
                <h1 className="bg-clip-text text-transparent text-5xl font-bold shadow-lg z-10 relative overflow-hidden">
                    <span className="text-gradient-animation">Super Lambo</span>
                </h1>
            </header>
            <main className="flex-grow flex justify-center items-center">
                <div className="w-[90%] h-[74vh] bg-white border-2 border-gray-300 rounded-2xl shadow-md flex flex-col md:flex-row p-4 relative">
                <div className="
                    flex
                    sm:flex-row gap-2
                    justify-center 
                    md:gap-20 flex-col
                    items-center 
                    flex-grow"
                >
                        {children} 
                    </div>
                    <div className="absolute right-5">
                        {backButton}
                    </div>
                </div>
            </main>
        </section>
    );
}
