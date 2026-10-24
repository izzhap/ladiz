import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { useState, useRef, useMemo, useEffect } from "react"

type TodoStatus = "completed" | "in_progress" | "pending"

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

export function TodoListDisplay({ todos }: { todos: any[] }) {
	const { t } = useTranslation()
	const [isCollapsed, setIsCollapsed] = useState(true)
	const ulRef = useRef<HTMLUListElement>(null)
	const itemRefs = useRef<(HTMLLIElement | null)[]>([])
	const scrollIndex = useMemo(() => {
		const inProgressIdx = todos.findIndex((todo: any) => todo.status === "in_progress")
		if (inProgressIdx !== -1) return inProgressIdx
		return todos.findIndex((todo: any) => todo.status !== "completed")
	}, [todos])

	const mostImportantTodo = useMemo(() => {
		const inProgress = todos.find((todo: any) => todo.status === "in_progress")
		if (inProgress) return inProgress
		return todos.find((todo: any) => todo.status !== "completed")
	}, [todos])

	useEffect(() => {
		if (isCollapsed) return
		if (!ulRef.current) return
		if (scrollIndex === -1) return
		const target = itemRefs.current[scrollIndex]
		if (target && ulRef.current) {
			const ul = ulRef.current
			const targetTop = target.offsetTop - ul.offsetTop
			const targetHeight = target.offsetHeight
			const ulHeight = ul.clientHeight
			const scrollTo = targetTop - (ulHeight / 2 - targetHeight / 2)
			ul.scrollTop = scrollTo
		}
	}, [todos, isCollapsed, scrollIndex])

	if (!Array.isArray(todos) || todos.length === 0) return null

	const totalCount = todos.length
	const completedCount = todos.filter((todo: any) => todo.status === "completed").length
	const allCompleted = completedCount === totalCount && totalCount > 0

	return (
		<div data-todo-list className="mt-1.5 -mx-3.5 px-3.5 pt-2 border-t border-white/[0.06] overflow-hidden">
			<div
				className={cn(
					"flex items-center gap-2 cursor-pointer select-none text-xs transition-colors",
					mostImportantTodo?.status === "in_progress" && isCollapsed
						? "text-amber-300"
						: "text-vscode-foreground hover:text-white",
				)}
				onClick={() => setIsCollapsed((v) => !v)}>
				<span
					className={cn(
						"size-2 rounded-full shrink-0 transition-colors",
						allCompleted
							? "bg-emerald-500"
							: mostImportantTodo?.status === "in_progress"
								? "bg-amber-400 animate-pulse"
								: "bg-vscode-descriptionForeground/50",
					)}
				/>
				<span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium">
					{isCollapsed
						? allCompleted
							? t("chat:todo.complete", { total: completedCount })
							: mostImportantTodo?.content
						: t("chat:todo.partial", { completed: completedCount, total: totalCount })}
				</span>
				<span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-vscode-descriptionForeground">
					{completedCount}/{totalCount}
				</span>
				<ChevronDown
					className={cn(
						"size-3 text-vscode-descriptionForeground transition-transform duration-200",
						!isCollapsed && "rotate-180",
					)}
				/>
			</div>
			{!isCollapsed && (
				<ul
					ref={ulRef}
					className="list-none max-h-[260px] overflow-y-auto mt-2 mb-1 pb-1 space-y-1.5 px-0.5 cursor-default">
					{todos.map((todo: any, idx: number) => {
						const status = (todo.status || "pending") as TodoStatus
						return (
							<li
								key={todo.id || todo.content}
								ref={(el) => (itemRefs.current[idx] = el)}
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
			)}
		</div>
	)
}
