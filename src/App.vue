<script>
export default {
  onLaunch() {
    if (import.meta.env.VITE_USE_CLOUD === 'true' && typeof wx !== 'undefined' && wx.cloud) {
      wx.cloud.init({
        env: import.meta.env.VITE_CLOUD_ENV || undefined,
        traceUser: true,
      })
    }
  },
}
</script>

<style lang="scss">
page {
  min-height: 100%;
  background: #efe7d6;
  color: #302a24;
}

view,
text,
image,
button,
input,
textarea,
picker {
  box-sizing: border-box;
}

button::after {
  border: 0;
}
</style>
