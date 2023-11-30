import { optimize } from 'svgo/dist/svgo.browser.js'

const createDimensionsExtractor = () => {
  const dimensions = {}
  const plugin = {
    type: 'visitor',
    name: 'extract-dimensions',
    fn() {
      return {
        element: {
          // Node, parentNode
          enter({ name, attributes }, { type }) {
            if (name === 'svg' && type === 'root') {
              if (attributes.width !== undefined && attributes.height !== undefined) {
                dimensions.width = Number.parseFloat(attributes.width)
                dimensions.height = Number.parseFloat(attributes.height)
              } else if (attributes.viewBox !== undefined) {
                const viewBox = attributes.viewBox.split(/,\s*|\s+/)
                dimensions.width = Number.parseFloat(viewBox[2])
                dimensions.height = Number.parseFloat(viewBox[3])
              }
            }
          },
        },
      }
    },
  }

  return [dimensions, plugin]
}

function compress(svgInput, settings) {
  // Setup plugin list
  const floatPrecision = Number(settings.floatPrecision)
  const transformPrecision = Number(settings.transformPrecision)
  const plugins = []

  for (const [name, enabled] of Object.entries(settings.plugins)) {
    if (!enabled) continue

    const plugin = {
      name,
      params: {},
    }

    plugin.params.floatPrecision = floatPrecision // Remove the switch to 1 precision

    plugin.params.transformPrecision = transformPrecision

    plugins.push(plugin)
  }

  // Multipass optimization
  const [dimensions, extractDimensionsPlugin] = createDimensionsExtractor()
  const { data, error } = optimize(svgInput, {
    multipass: settings.multipass,
    plugins: [...plugins, extractDimensionsPlugin],
    js2svg: {
      indent: 2,
      pretty: settings.pretty,
    },
  })

  if (error) throw new Error(error)

  return { data, dimensions }
}

const actions = {
  wrapOriginal({ data }) {
    const [dimensions, extractDimensionsPlugin] = createDimensionsExtractor()
    const { error } = optimize(data, {
      plugins: [extractDimensionsPlugin],
    })

    if (error) throw new Error(error)

    return dimensions
  },
  process({ data, settings }) {
    return compress(data, settings)
  },
}

self.onmessage = (event) => {
  try {
    self.postMessage({
      id: event.data.id,
      result: actions[event.data.action](event.data),
    })
  } catch (error) {
    self.postMessage({
      id: event.data.id,
      error: error.message,
    })
  }
}
