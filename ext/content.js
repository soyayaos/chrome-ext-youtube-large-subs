const settings = {
    startOnComplete: false,
    currentSub: {
        class: 'ytp-caption-segment',
        defaultText: 'waiting for subs...',
        proxy: false,
        container: false,
    },
    interval: 100,
    newContainer: {
        style: {
            fontSize: '36px',
            padding: '8px',
            background: 'rgba(8, 8, 8, 0.75)',
            color: '#ffffff',
            display: 'none',
        },
    },
    player: {
        observer: false,
        container: false,
        id: 'ytd-player',
        wide: {
            id: 'player-theater-container',
            cookie: 'wide=1',
        },
        buttons: {
            'ytp-size-button': {
                bind: false,
                handler: async (e) => {
                    e.stopPropagation()
                    addContainerAfterPlayer()

                    return true
                },
            },
            'ytp-subtitles-button': {
                isSub: true,
                bind: false,
                sub: {
                    attr: 'aria-pressed',
                    value: 'true'
                },
                handler: async (e) => {
                    e.stopPropagation()
                    setContainerVisible(e.target)

                    return true
                },
            }
        }
    },
}

const setContainerVisible = async (e) => {
    settings.currentSub.proxy.visible = e.getAttribute(settings.player.buttons['ytp-subtitles-button'].sub.attr) === settings.player.buttons['ytp-subtitles-button'].sub.value

    return true
}

const log = async (...msg) => {
    console.log(['[ytls]', ...msg].join(' '))

    return true
}

const warn = async (...msg) => {
    console.warn(['[ytls]', ...msg].join(' '))

    return true
}

const isWide = () => {
    return document.cookie.indexOf(settings.player.wide.cookie) > -1
}

const updateContainer = async (k, v) => {
    if (settings.currentSub.container) {
        if (k === 'text') {
            settings.currentSub.container.textContent = v
        } else if (k === 'visible') {
            settings.currentSub.container.style.display = v ? 'block' : 'none'
        }
    }

    return true
}

const waitForSubs = async () => {
    settings.currentSub.proxy = new Proxy({
        text: settings.currentSub.defaultText,
        visible: false,
    }, {
        set(target, k, v) {
            target[k] = v
            updateContainer(k, v)
            return true
        }
    })
    const ws = setInterval(() => {
        const subs = document.getElementsByClassName(settings.currentSub.class)
        if (subs && subs.length > 0) {
            const text = subs[subs.length - 1].innerText
            if (text !== settings.currentSub.proxy.text) {
                settings.currentSub.proxy.text = text
            }
        }

        return true
    }, settings.interval)

    return true
}

const newContainer = () => {
    const block = document.createElement('div')
    Object.entries(settings.newContainer.style).forEach((entry) => {
        const [name, value] = entry
        block.style[name] = value
    })
    // debug
    // block.classList.add('yt-large-subs')

    return block
}

const createContainer = async () => {
    settings.currentSub.container = newContainer()

    return true
}

const addContainerAfterPlayer = async () => {
    const ci = setInterval(() => {
        if (
            settings.player.container instanceof HTMLElement
            && settings.currentSub.container instanceof HTMLElement
        ) {
            clearInterval(ci)
            let parent = false
            let useAdj = false
            if (isWide() === false) {
                // normal
                parent = settings.player.container.parentNode.parentNode.parentNode.parentNode.parentNode
            } else {
                // wide
                parent = document.getElementById(settings.player.wide.id)
                useAdj = true
            }
            if (settings.currentSub.container.parentNode !== parent.parentNode) {
                if (useAdj) {
                    parent.insertAdjacentElement('afterend', settings.currentSub.container)
                } else {
                    parent.appendChild(settings.currentSub.container)
                }
            }
        }
    }, settings.interval)

    return true
}

const waitForPlayer = async () => {
    settings.player.observer = new MutationObserver((records) => {
        if (settings.player.container) {
            settings.player.observer.disconnect()
            return true
        }
        records.forEach((record) => {
            if (record.addedNodes && record.addedNodes.length > 0) {
                record.addedNodes.forEach((node) => {
                    if (
                        node.nodeName === 'DIV'
                        && node.id === 'container'
                        && node.className.indexOf(settings.player.id) > -1
                    ) {
                        settings.player.container = node
                    }
                })
            }
        })

        return true
    })
    settings.player.observer.observe(document.body, {
        childList: true,
        subtree: true,
    })

    return true
}

const bindButtons = async () => {
    const bi = setInterval(() => {
        const buttons = Object.entries(settings.player.buttons)
        let binded = 0
        buttons.forEach((button) => {
            const [className, content] = button
            if (content.bind) {
                binded += 1
            } else {
                const list = document.getElementsByClassName(className)
                if (list.length > 0) {
                    list[0].addEventListener('click', content.handler)
                    content.bind = true
                    if (content.isSub) {
                        setContainerVisible(list[0])
                    }
                }
            }
        })
        if (binded === buttons.length) {
            clearInterval(bi)
        }
    }, settings.interval)

    return true
}

const addStyles = async () => {
    const style = document.createElement('style')
    style.textContent = `
        .ytp-caption-segment {
            display: none !important;
        }
    `
    document.head.appendChild(style)

    return true
}

const init = () => {
    addStyles()
    createContainer()
    waitForSubs()
    waitForPlayer()
    addContainerAfterPlayer()
    bindButtons()

    return true
}

const start = () => {
    chrome.storage.sync.get("status", ({ status }) => {
        if (typeof status !== 'boolean') {
            status = false
        }
        if (status) {
            init()
        }
    })

    return true
}

if (settings.startOnComplete) {
    document.addEventListener('readystatechange', (e) => {
        if (document.readyState === 'complete') {
            start()
        }
    })
} else {
    start()
}
