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
  background: #fff9f5;
  color: #542b35;
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
