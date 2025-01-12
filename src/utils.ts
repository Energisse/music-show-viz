export const formatListenTime = (time: number) => {
    if (time > 3600) {
        return `${Math.floor(time / 3600)}h${Math.floor((time % 3600) / 60)}min`
    }
    return `${(time / 60).toFixed(1)}min`
}