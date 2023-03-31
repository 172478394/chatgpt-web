import './chat.css'
import css from '../../App.module.css'
import '../../chatui-theme.css'
import Chat, {Bubble, MessageProps, Progress, toast, useMessages,} from '@chatui/core'
import '@chatui/core/dist/index.css'
import '@chatui/core/es/styles/index.less'
import {useState} from 'react'
import clipboardy from 'clipboardy'
import MdEditor from "md-editor-rt"
import "md-editor-rt/lib/style.css"
import sanitizeHtml from 'sanitize-html';
import {completion} from '../../services/port'
import riseInput from "@chatui/core/lib/components/Composer/riseInput";

const defaultQuickReplies = [
    {
        name: '清空会话',
        isNew: true,
        isHighlight: true,
    },
    {
        name: '复制会话',
        isNew: false,
        isHighlight: true,
    },
]

const initialMessages = [
    {
        type: 'text',
        content: {
            text: '您好，我是AI助理。受限于api，上下文功能仅在最后2次对话有效。请尽量在单次对话中完成操作。',
        },
        user: {avatar: '//gitclone.com/download1/gitclone.png'},
    },
]

let chatContext: any[] = []

function App() {
    const {messages, appendMsg, setTyping, prependMsgs} = useMessages(initialMessages)
    const [percentage, setPercentage] = useState(0)

    const handleFocus = () => {
        setTimeout(() => {
            const input = document.querySelector('textarea');
            if (input !== null) {
                input.scrollIntoView();
            }
            // window.scrollTo(0, document.body.scrollHeight)

        }, 100)
    }

    const handleBlur = () => {
        setTimeout(() => {
            // document.body.scrollIntoView();
            const input = document.querySelector('textarea');
            if (input !== null) {
                input.scrollIntoView();
            }
        }, 100)
    }

    // clearQuestion 清空文本特殊字符
    function clearQuestion(requestText: string) {
        requestText = requestText.replace(/\s/g, '')
        const punctuation = ',.;!?，。！？、…'
        const runeRequestText = requestText.split('')
        const lastChar = runeRequestText[runeRequestText.length - 1]
        if (punctuation.indexOf(lastChar) < 0) {
            requestText = requestText + '。'
        }
        return requestText
    }

    // clearQuestion 清空文本换行符号
    function clearReply(reply: string) {
        // TODO 清洗回复特殊字符
        return reply
    }

    function handleSend(type: string, val: string) {
        if (percentage > 0) {
            toast.fail('正在等待上一次回复，请稍后')
            return
        }
        if (type === 'text' && val.trim()) {
            appendMsg({
                type: 'text',
                content: {text: val},
                position: 'right',
                user: {avatar: '//gitclone.com/download1/user.png'},
            })

            setTyping(true)
            setPercentage(10)
            onGenCode(val)
        }
    }

    function renderMessageContent(msg: MessageProps) {
        const {type, content} = msg

        switch (type) {
            case 'text':
                let text = content.text
                let isHtml = sanitizeHtml(text) !== text;
                const richTextRegex = /(<[^>]+>)|(```[^`]*```)/gi;
                const isRichText = richTextRegex.test(text);
                if (isHtml || isRichText) {
                    return (
                        <Bubble><MdEditor
                            style={{float: 'left'}}
                            modelValue={text} // 要展示的markdown字符串
                            previewOnly={true} // 只展示预览框部分
                        ></MdEditor></Bubble>
                    )
                } else {
                    return (
                        <Bubble>{text}</Bubble>
                    )
                }

            default:
                return null
        }
    }

    async function handleQuickReplyClick(item: { name: string }) {
        if (item.name === '清空会话') {

            chatContext.splice(0)
            messages.splice(0)
            prependMsgs(messages)
        }
        if (item.name === '复制会话') {
            if (messages.length <= 1) {
                return
            }
            const r = messages
                .slice(1)
                .filter((it) => it.type === 'text')
                .map((it) => it.content.text)
                .join('\n')
            console.log('messages', messages, r)
            await clipboardy.write(r)
            toast.success('复制成功', 10_000)
        }
    }

    async function onGenCode(question: string) {
        question = clearQuestion(question)
        chatContext.push({
            role: 'user',
            content: question,
        })

        let newChatContext: any[] = []
        const newChatContextLen = 5
        if (chatContext.length <= newChatContextLen) {
            newChatContext = chatContext
        } else {
            newChatContext = chatContext.slice(-newChatContextLen)
        }

        const res = await completion(newChatContext);
        if (res.data.code === 200) {
            let reply = clearReply(res.data.data.reply)
            appendMsg({
                type: 'text',
                content: {text: reply},
                user: {avatar: '//gitclone.com/download1/gitclone.png'},
            })
            chatContext = res.data.data.messages
            console.log(chatContext)
            setPercentage(0)

            setTimeout(() => {
                const input = document.querySelector('textarea');
                if (input !== null) {
                    input.scrollIntoView();
                }
            }, 100)
        } else {
            return toast.fail('请求出错，' + res.data.errorMsg, undefined)
        }
    }

    return (
        <div className={css.app}>
            <Chat
                navbar={{
                    leftContent: {
                        icon: 'chevron-left',
                        title: 'Back',
                    },
                    rightContent: [
                        {
                            icon: 'apps',
                            title: 'Applications',
                        },
                        {
                            icon: 'ellipsis-h',
                            title: 'More',
                        },
                    ],
                    title: '基于ChatGPT的AI助手',
                }}
                messages={messages}
                renderMessageContent={renderMessageContent}
                quickReplies={defaultQuickReplies}
                onQuickReplyClick={handleQuickReplyClick}
                onSend={handleSend}
                onInputFocus={handleFocus}
                onInputBlur={handleBlur}
            />
            <Progress value={percentage}/>
        </div>
    )
}

export default App
