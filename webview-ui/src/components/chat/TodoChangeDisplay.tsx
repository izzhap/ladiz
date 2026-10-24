import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

type TodoStatus = "completed" | "in_progress" | "pending"

interface TodoItem {
	id?: string
	content: string
	status?: TodoStatus | string
}

interface TodoChangeDisplayProps {
	previousTodos: TodoItem[]
	newTodos: TodoItem[]
}

function getStatusDot(status: TodoStatus | null) {
	switch (status) {
		case "completed":
			return <span className="size-1.5 rounded-full bg-emerald-500/80 mt-2 shrink-0" />
		case "in_progress":
			return (
				<span className="size-1.5 rounded-full bg-amber-400 mt-2 shrink-0 animate-pulse ring-2 ring-amber-400/20" />
			)
		default:
			return (
				<span className="size-1.5 rounded-full border border-vscode-descriptionForeground/40 mt-2 shrink-0" />
			)
	}
}

export function TodoChangeDisplay({ previousTodos, newTodos }: TodoChangeDisplayProps) {
	const { t } = useTranslation()
	const isInitialState = previousTodos.length === 0

	let todosToDisplay: TodoItem[]
	if (isInitialState && newTodos.length > 0) {
		todosToDisplay = newTodos
	} else {
		todosToDisplay = newTodos.filter((newTodo) => {
			if (newTodo.status === "completed") {
				const previousTodo = previousTodos.find((p) => p.id === newTodo.id || p.content === newTodo.content)
				return !previousTodo || previousTodo.status !== "completed"
			}
			if (newTodo.status === "in_progress") {
				const previousTodo = previousTodos.find((p) => p.id === newTodo.id || p.content === newTodo.content)
				return !previousTodo || previousTodo.status !== "in_progress"
			}
			return false
		})
	}

	if (todosToDisplay.length === 0) {
		return null
	}

	return (
		<div data-todo-changes className="overflow-hidden">
			<div className="flex items-center gap-2 mb-1.5">
				<span className="size-2 rounded-full bg-blue-400 shrink-0" />
				<span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-vscode-foreground">
					{t("chat:todo.updated")}
				</span>
			</div>

			<div className="pl-1 pr-1 font-light leading-normal">
				<ul className="list-none space-y-1.5 my-1">
					{todosToDisplay.map((todo) => {
						const status = (todo.status || "pending") as TodoStatus
						return (
							<li
								key={todo.id || todo.content}
								className={cn(
									"text-xs flex flex-row gap-2.5 items-start min-h-[20px] leading-relaxed",
									status === "in_progress" && "text-amber-300 font-medium",
									status === "completed" &&
										"text-vscode-descriptionForeground/60 line-through decoration-vscode-descriptionForeground/30",
									status === "pending" && "text-vscode-foreground/80",
								)}>
								{getStatusDot(status)}
								<span className="select-text break-words flex-1">{todo.content}</span>
							</li>
						)
					})}
				</ul>
			</div>
		</div>
	)
}
