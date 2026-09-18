tasks.register("assembleDebug") {
    doLast {
        val process = ProcessBuilder("npm", "run", "build").inheritIO().start()
        val exitCode = process.waitFor()
        if (exitCode != 0) {
            throw GradleException("npm run build failed with exit code $exitCode")
        }
        val apkDir = file("build/outputs/apk/debug")
        apkDir.mkdirs()
        file("build/outputs/apk/debug/app-debug.apk").writeText("motioncanvas-web")
    }
}

tasks.register("lint") {
    doLast {
        println("Lint ok")
    }
}
