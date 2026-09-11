import { createCloudRepository } from './cloudRepository.js'
import { createLocalRepository } from './localRepository.js'

const useCloud = import.meta.env.VITE_USE_CLOUD === 'true' && typeof wx !== 'undefined' && Boolean(wx.cloud)

export const repository = useCloud ? createCloudRepository() : createLocalRepository()
export const repositoryMode = useCloud ? 'cloud' : 'local'
